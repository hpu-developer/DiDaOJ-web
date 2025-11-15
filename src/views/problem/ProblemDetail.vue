<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, WatchStopHandle } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetProblem, GetProblemDaily, ParseProblem, PostProblemCrawl } from "@/apis/problem.ts";
import { GetHighlightKeyByJudgeLanguage, GetSubmitLanguages, IsJudgeLanguageValid, JudgeLanguage } from "@/apis/language.ts";
import { useCurrentInstance } from "@/util";
import { ShowErrorTips, ShowTextTipsInfo, ShowTextTipsError } from "@/util/tips";
import { ProblemTag, ProblemView } from "@/types/problem.ts";
import { PostJudgeJob, PostJudgeTestRun } from "@/apis/judge.ts";

import { useWebStyleStore } from "@/stores/webStyle.ts";

import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";
import { GetContestProblemIndexStr, GetContestProblemRealKey, GetContestProblems } from "@/apis/contest.ts";
import { handleGotoContestProblem, handleGotoLogin } from "@/util/router.ts";
import SecretPanel from "@/components/SecretPanel.vue";
import { useFooterStyleStore } from "@/stores/footerStyle";

let route = useRoute();
const { globalProperties } = useCurrentInstance();
let watchHandle: WatchStopHandle | null = null;

const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

const footerStyleStore = useFooterStyleStore();

let problemDescription = ref("");

let problemKey = "";
let problemId = 0;
let dailyId = "";
let contestId = 0;
let problemIndex = ref(0);

const isContestProblem = ref(false);
const isDailyProblem = ref(false);

const problemLoading = ref(false);
const problemData = ref<ProblemView | null>(null);
let codeEditor = null as IStandaloneCodeEditor | null;
const codeEditRef = ref<HTMLElement | null>(null);
const codeEditRefZen = ref<HTMLElement | null>(null);
const problemCrawlLoading = ref(false);

// 代码缓存相关变量
const getCacheKey = () => {
  const key = problemKey || `daily-${dailyId}` || `contest-${contestId}-${problemIndex.value}`;
  return `code_cache_${key}`;
};
const problemSubmitting = ref(false);

const tagsMap = {} as { [key: number]: ProblemTag };

const selectLanguage = ref<string>("");
const languageOptions = ref([] as { label: string; value: JudgeLanguage | undefined }[]);
const isPrivate = ref(false);

const contestProblems = ref<number[]>([]);

const dailyUpdateProgressTimer = ref<number | null>(null);
const dailySolutionUnlockCountdown = ref(-1);
const dailyCodeUnlockCountdown = ref(-1);
const dailySolution = ref("");
const dailyCode = ref("");
let serverTimeOffset = 0;

const isZenMode = ref(false);

// 测试运行相关变量
const testInput = ref("");
const testOutput = ref("");
const testRunning = ref(false);

// 高度管理相关变量
const testRunContainerHeight = ref(120);
const testRunContainerRef = ref<HTMLElement | null>(null);
let testRunResizeObserver: ResizeObserver | null = null;

// 拖拽相关变量
let isDragging = ref(false);
let dragStartY = 0;
let dragStartHeight = 0;

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageProblem);
});

const hasEditDailyAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageProblemDaily);
});

const isLogin = computed(() => {
  return userStore.isLogin();
});

const loadDailyData = async () => {
  clearDailyTimer();
  isDailyProblem.value = false;
  const res = await GetProblemDaily(dailyId);
  if (res.code !== 0) {
    return;
  }
  isDailyProblem.value = true;
  const daily = res.data.problem_daily;
  problemKey = daily.problem_key;
  dailySolution.value = daily.solution;
  dailyCode.value = daily.code;

  const serverTime = new Date(res.data.time);
  serverTimeOffset = serverTime.getTime() - new Date().getTime();
  const localTime = new Date(serverTime.getTime());
  const year = localTime.getFullYear();
  const month = String(localTime.getMonth() + 1).padStart(2, "0");
  const day = String(localTime.getDate()).padStart(2, "0");
  const timeId = `${year}-${month}-${day}`;
  if (dailyId === timeId) {
    // 如果是当日的每日一题，则获取距离18点的倒计时
    const duration = serverTime.getHours() * 60 * 60 + serverTime.getMinutes() * 60 + serverTime.getSeconds();
    const duration18 = 18 * 60 * 60;
    if (duration < duration18) {
      dailySolutionUnlockCountdown.value = duration18 - duration;
    } else {
      dailySolutionUnlockCountdown.value = -1;
    }
    dailyCodeUnlockCountdown.value = 24 * 60 * 60 - duration;
  }
  if (dailySolutionUnlockCountdown.value >= 0 || dailyCodeUnlockCountdown.value >= 0) {
    createDailyTimer();
  }
};

const createDailyTimer = () => {
  if (dailyUpdateProgressTimer.value) {
    clearInterval(dailyUpdateProgressTimer.value);
  }
  dailyUpdateProgressTimer.value = setInterval(() => {
    const solutionUnlock = dailySolutionUnlockCountdown.value <= 0;

    const serverTime = new Date(new Date().getTime() + serverTimeOffset);
    const duration = serverTime.getHours() * 60 * 60 + serverTime.getMinutes() * 60 + serverTime.getSeconds();
    const duration18 = 18 * 60 * 60;
    if (duration < duration18) {
      dailySolutionUnlockCountdown.value = duration18 - duration;
    } else {
      dailySolutionUnlockCountdown.value = -1;
    }
    dailyCodeUnlockCountdown.value = 24 * 60 * 60 - duration;
    if ((!solutionUnlock && dailySolutionUnlockCountdown.value <= 0) || dailyCodeUnlockCountdown.value <= 0) {
      loadDailyData();
    }
  }, 1000);
};

const clearDailyTimer = () => {
  if (dailyUpdateProgressTimer.value) {
    clearInterval(dailyUpdateProgressTimer.value);
    dailyUpdateProgressTimer.value = null;
  }
};

const handleClickTag = (tag: ProblemTag) => {
  if (!tag) {
    return;
  }
  router.push({
    name: "problem-list",
    query: {
      ...route.query,
      title: "",
      tag: tag.name,
    },
  });
};

const handleClickDailyEdit = async () => {
  if (!dailyId) {
    ShowTextTipsError(globalProperties, "每日问题标识无效");
    return;
  }
  await router.push({
    name: "manage-problem-daily",
    params: {
      dailyId: dailyId,
    },
  });
};

let resizeObserver: ResizeObserver | null = null;

// 高度调整相关方法
const calculateEditorHeight = () => {
  if (!isZenMode.value || !testRunContainerRef.value) return;
  
  // 计算代码编辑器的高度 = 总高度 - 测试运行框高度 - 其他元素高度
  const totalHeight = window.innerHeight - 56; // 减去头部高度
  const testRunHeight = testRunContainerRef.value.offsetHeight;
  const otherElementsHeight = 100; // 其他元素(头部、边距等)的预估高度
  
  const editorHeight = Math.max(300, totalHeight - testRunHeight - otherElementsHeight);
  
  // 设置代码编辑器高度
  const editorElement = document.querySelector('.dida-code-editor-zen-div') as HTMLElement;
  if (editorElement) {
    editorElement.style.height = `${editorHeight}px`;
  }
};

const initTestRunContainerObserver = () => {
  if (testRunResizeObserver) {
    testRunResizeObserver.disconnect();
    testRunResizeObserver = null;
  }

  if (testRunContainerRef.value) {
    testRunResizeObserver = new ResizeObserver(() => {
      // 测试运行框高度变化时，重新计算代码编辑器高度
      calculateEditorHeight();
    });
    testRunResizeObserver.observe(testRunContainerRef.value);
  }
};

// 拖拽处理方法
const startDrag = (event: MouseEvent) => {
  isDragging.value = true;
  dragStartY = event.clientY;
  dragStartHeight = testRunContainerRef.value?.offsetHeight || 200;
  
  // 添加拖拽状态类
  const handleElement = event.currentTarget as HTMLElement;
  handleElement.classList.add('dragging');
  
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'ns-resize';
};

const drag = (event: MouseEvent) => {
  if (!isDragging.value || !testRunContainerRef.value) return;
  
  const deltaY = event.clientY - dragStartY;
  // 向上拖动时，deltaY为负，应该减少高度；向下拖动时，deltaY为正，应该增加高度
  const newHeight = Math.max(60, Math.min(500, dragStartHeight - deltaY));
  
  testRunContainerRef.value.style.height = `${newHeight}px`;
  testRunContainerHeight.value = newHeight;
  
  // 实时调整代码编辑器高度
  calculateEditorHeight();
};

const endDrag = () => {
  isDragging.value = false;
  
  // 移除拖拽状态类
  const handleElements = document.querySelectorAll('.drag-resize-handle.dragging');
  handleElements.forEach(element => {
    element.classList.remove('dragging');
  });
  
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
};

const handleZenMode = () => {
  const wasZenMode = isZenMode.value;
  isZenMode.value = !isZenMode.value;

  // 保存 zen 模式设置
  localStorage.setItem("problem_zen_mode", isZenMode.value ? "1" : "0");

  footerStyleStore.setFooterShow(!isZenMode.value);

  // 如果模式发生了变化，需要重新创建编辑器
  if (wasZenMode !== isZenMode.value) {
    // 先清理之前的 resizeObserver
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    // 清理测试运行框观察者
    if (testRunResizeObserver) {
      testRunResizeObserver.disconnect();
      testRunResizeObserver = null;
    }

    nextTick(() => {
      // 获取当前模式下的编辑器容器
      const currentContainerRef = isZenMode.value ? codeEditRefZen : codeEditRef;
      handleResetCode(currentContainerRef);

      // 重新设置 resizeObserver
      if (currentContainerRef.value) {
        resizeObserver = new ResizeObserver(() => {
          if (codeEditor) {
            codeEditor.layout();
          }
        });
        resizeObserver.observe(currentContainerRef.value);
      }

      // 初始化测试运行框观察者（仅在禅模式下）
      if (isZenMode.value) {
        initTestRunContainerObserver();
        // 延迟计算高度，确保DOM更新完成
        setTimeout(() => {
          calculateEditorHeight();
        }, 100);
      }
    });
  }
}

const handleClickEdit = async () => {
  let realProblemKey = problemKey;

  if (!realProblemKey) {
    try {
      const res = await GetContestProblemRealKey(contestId, problemIndex.value);
      if (res.code === 0) {
        realProblemKey = res.data;
      } else {
        ShowErrorTips(globalProperties, res.code);
      }
    } catch (error) {
      ShowTextTipsError(globalProperties, "获取题目ID失败，请稍后再试");
      return;
    }
  }

  await router.push({
    name: "manage-problem",
    params: {
      problemKey: realProblemKey,
    },
  });
};

const handleClickJudgeStatus = () => {
  if (problemKey) {
    router.push({
      name: "judge-list",
      query: {
        problem_key: problemKey,
      },
    });
  } else {
    router.push({
      name: "contest-judge",
      params: {
        contestId: contestId,
      },
      query: {
        problem_key: GetContestProblemIndexStr(problemIndex.value),
      },
    });
  }
};

const handleClickDiscuss = () => {
  if (problemKey) {
    router.push({
      name: "discuss-list-problem",
      query: {
        problem_key: problemKey,
      },
    });
  } else {
    router.push({
      name: "contest-discuss",
      params: {
        contestId: contestId,
      },
      query: {
        problem_key: GetContestProblemIndexStr(problemIndex.value),
      },
    });
  }
};

const handleClickStatistics = () => {
  router.push({
    name: "problem-statistics",
    params: {
      problemKey: problemKey,
    },
  });
};

const handleClickRecommend = () => {
  router.push({
    name: "problem-recommend",
    params: {
      problemKey: problemKey,
    },
  });
};

const fetchProblemData = async () => {
  contestProblems.value = [];

  let res = await GetProblem(problemKey, contestId, problemIndex.value);

  if (res.code !== 0) {
    problemLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "problem" });
    return;
  }

  res.data.problem.tags = [];
  if (res.data.tags) {
    res.data.tags.forEach((tag: ProblemTag) => {
      tagsMap[tag.id] = tag;
    });
    res.data.problem.tags = res.data.tags.map((tag: ProblemTag) => tag.id);
  }

  problemData.value = ParseProblem(res.data.problem, tagsMap);

  problemId = problemData.value.id;
  problemKey = problemData.value.key;

  webStyleStore.setTitle(problemData.value.title + " - " + webStyleStore.getRouteTitle);

  if (contestId) {
    res = await GetContestProblems(contestId);
    if (res.code === 0) {
      res.data.problems.sort((a: number, b: number) => a - b);
      contestProblems.value = res.data.problems;
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  }

  const originOj = problemData.value.originOj;
  languageOptions.value = GetSubmitLanguages(originOj) as { label: string; value: JudgeLanguage | undefined }[];

  // 从本地缓存读取selectLanguage
  const localSelectLanguageStr = localStorage.getItem("problem_select_language");
  if (localSelectLanguageStr) {
    // 转换为JudgeLanguage类型并判断是否在语言选项中
    const parsedLanguage = parseInt(localSelectLanguageStr);
    if (!isNaN(parsedLanguage) && languageOptions.value.some((lang) => lang.value === parsedLanguage)) {
      selectLanguage.value = parsedLanguage as JudgeLanguage;
    }
  }


  problemDescription.value = problemData.value.description as string;
  await nextTick(() => {
    if (!codeEditor) {
      // 根据当前模式选择容器
      const initialContainerRef = isZenMode.value ? codeEditRefZen : codeEditRef;
      handleResetCode(initialContainerRef);

      // 初始化 resizeObserver
      if (initialContainerRef.value) {
        resizeObserver = new ResizeObserver(() => {
          if (codeEditor) {
            codeEditor.layout();
          }
        });
        resizeObserver.observe(initialContainerRef.value);
      }
    }
    problemLoading.value = false;
  });
};

const handleClickCrawl = async () => {
  const originOj = problemData.value?.originOj;
  const originId = problemData.value?.originId;
  if (!originOj || !originId) {
    return;
  }

  try {
    problemCrawlLoading.value = true;
    const res = await PostProblemCrawl(originOj, originId);
    if (res.code === 0) {
      await fetchProblemData();
      ShowTextTipsInfo(globalProperties, "更新成功");
    } else {
      ShowErrorTips(globalProperties, res.code);
    }
  } catch (error) {
    ShowTextTipsError(globalProperties, "更新失败，请稍后再试");
  } finally {
    problemCrawlLoading.value = false;
  }
};

const handleSubmitCode = async () => {
  const selectLanguageValue = parseInt(selectLanguage.value);
  if (!IsJudgeLanguageValid(selectLanguageValue)) {
    ShowTextTipsError(globalProperties, "请选择所编写的语言");
    return;
  }
  const code = codeEditor?.getValue();
  if (!code) {
    ShowTextTipsError(globalProperties, "请输入所需提交的代码");
    return;
  }
  if (!problemKey && (!contestId || !problemIndex.value)) {
    ShowTextTipsError(globalProperties, "问题标识无效");
    return;
  }

  problemSubmitting.value = true;

  try {
    const res = await PostJudgeJob(problemId, contestId, problemIndex.value, selectLanguageValue, code, isPrivate.value);
    if (res.code !== 0) {
      ShowErrorTips(globalProperties, res.code);
      return;
    }

    ShowTextTipsInfo(globalProperties, "提交成功，正在跳转到详情页面");

    const statusId = res.data.id;

    // 提交成功后清空代码缓存
    localStorage.removeItem(getCacheKey());

    if (contestId) {
      await router.push({
        name: "contest-judge-detail",
        params: {
          contestId: contestId,
          judgeId: statusId,
        },
      });
    } else {
      await router.push({
        name: "judge-detail",
        params: {
          judgeId: statusId,
        },
      });
    }
  } finally {
    problemSubmitting.value = false;
  }
};

const handleResetCode = (containerRef?: Ref<HTMLElement | null>) => {
  //   const codeTemplate = `#include <iostream>
  // using namespace std;
  // int main() {
  // \tint a, b;
  // // code-edit-start
  // {{ code1 }}
  // // code-edit-end
  //
  // \twhile (cin >> a >> b) {
  // // code-edit-start
  // {{ code2 }}
  // // code-edit-end
  // \t}
  // \treturn 0;
  // }`;

  // 重置代码时清空本地缓存并使用空模板
  const codeTemplate = "";

  // 重置时使用缓存
  let oldCodeValue = localStorage.getItem(getCacheKey()) || codeTemplate;

  let isContainReadOnly = false;
  if (codeTemplate) {
    isContainReadOnly = true;
  }

  // 如果已有 editor，先销毁旧实例
  if (codeEditor) {
    codeEditor.dispose();
  }

  // 确定使用哪个容器
  const targetContainer = containerRef ? containerRef.value : codeEditRef.value;

  // 确保目标容器不为null
  if (targetContainer) {
    // 清空现有内容
    targetContainer.innerHTML = '';

    // 创建编辑器容器
    const editorContainer = document.createElement("div");
    editorContainer.style.width = "100%";
    editorContainer.style.height = "100%";

    codeEditor = monaco.editor.create(editorContainer, {
      value: oldCodeValue,
      language: "cpp",
      minimap: { enabled: true },
      colorDecorators: true,
      readOnly: false,
      theme: "vs-dark",
      automaticLayout: true,
    });

    targetContainer.appendChild(editorContainer);

    // 确保编辑器正确布局
    nextTick(() => {
      if (codeEditor && targetContainer) {
        codeEditor.layout();
      }
    });
  }

  // 确保codeEditor不为null再进行后续操作
  if (codeEditor) {
    const model = codeEditor.getModel();
    let decorationIds: string[] = [];

    // 动态查找所有可编辑区域
    function getEditableRanges(): monaco.Range[] {
      // 确保model不为null
      if (!model) return [];

      const ranges: monaco.Range[] = [];
      let startLine = 0;
      for (let i = 1; i <= model.getLineCount(); i++) {
        const line = model.getLineContent(i);
        if (line.includes("code-edit-start")) startLine = i;
        else if (line.includes("code-edit-end") && startLine) {
          ranges.push(new monaco.Range(startLine + 1, 1, i - 1, model.getLineMaxColumn(i - 1)));
          startLine = 0; // 重置
        }
      }
      return ranges;
    }

    // 判断 change 是否在任意可编辑区
    function isChangeAllowed(change: monaco.editor.IModelContentChange): boolean {
      const editableRanges = getEditableRanges();
      for (const range of editableRanges) {
        if (range.containsRange(change.range)) return true;
      }
      return false;
    }

    // 动态更新装饰（只读行视觉提示）
    function updateDecorations() {
      // 确保model不为null
      if (!model) return;

      const editableRanges = getEditableRanges();
      const decs: monaco.editor.IModelDeltaDecoration[] = [];

      let lastEnd = 0;
      for (const range of editableRanges) {
        // 上方不可编辑行
        if (range.startLineNumber - 1 > lastEnd) {
          decs.push({
            range: new monaco.Range(lastEnd + 1, 1, range.startLineNumber - 1, 1),
            options: { isWholeLine: true, className: "readonly-line" },
          });
        }
        lastEnd = range.endLineNumber;
      }
      // 下方不可编辑行
      if (lastEnd < model.getLineCount()) {
        decs.push({
          range: new monaco.Range(lastEnd + 1, 1, model.getLineCount(), 1),
          options: { isWholeLine: true, className: "readonly-line" },
        });
      }

      decorationIds = model.deltaDecorations(decorationIds, decs);
    }

    if (model) {
      if (isContainReadOnly) {
        // 初始化一次装饰
        updateDecorations();
      }
      // 监听内容变化
      model.onDidChangeContent((e) => {
        if (!codeEditor) {
          return;
        }
        if (isContainReadOnly) {
          for (const change of e.changes) {
            if (!isChangeAllowed(change)) {
              codeEditor.trigger("prevent-edit", "undo", null);
            }
          }
          updateDecorations();
        }
        // 自动保存代码到本地缓存
        const currentCode = codeEditor.getValue();
        localStorage.setItem(getCacheKey(), currentCode);
      });
    }
  }
};

const handleClickResetCode = () => {
  // 清空本地缓存
  localStorage.removeItem(getCacheKey());
  const initialContainerRef = isZenMode.value ? codeEditRefZen : codeEditRef;
  handleResetCode(initialContainerRef);
};

const handlePrivateChanged = (value: boolean): void => {
  isPrivate.value = value;
  // 保存到本地存储
  localStorage.setItem("problem_submit_private", value ? "1" : "0");
};

// 测试运行处理函数
const handleTestRun = async () => {
  if (!problemData.value) {
    ShowTextTipsError(globalProperties, "题目数据未加载");
    return;
  }

  const selectLanguageValue = parseInt(selectLanguage.value);
  if (!IsJudgeLanguageValid(selectLanguageValue)) {
    ShowTextTipsError(globalProperties, "请选择编程语言");
    return;
  }

  if (!codeEditor) {
    ShowTextTipsError(globalProperties, "代码编辑器未初始化");
    return;
  }

  const code = codeEditor.getValue();
  if (!code.trim()) {
    ShowTextTipsError(globalProperties, "请输入要测试的代码");
    return;
  }

  if (!testInput.value.trim()) {
    ShowTextTipsError(globalProperties, "请输入测试数据");
    return;
  }

  try {
    testRunning.value = true;
    testOutput.value = "测试运行中...";

    const res = await PostJudgeTestRun(
      problemData.value.id,
      selectLanguageValue as JudgeLanguage,
      code,
      testInput.value
    );

    if (res.code === 0) {
      testOutput.value = res.data.output || "无输出";
    } else {
      ShowErrorTips(globalProperties, res.code);
      testOutput.value = "测试运行失败";
    }
  } catch (error) {
    ShowTextTipsError(globalProperties, "测试运行失败，请稍后再试");
    testOutput.value = "测试运行失败";
  } finally {
    testRunning.value = false;
  }
};

const onSelectLanguageChanged = (value: JudgeLanguage): void => {
  if (!codeEditor) {
    return;
  }
  const model = codeEditor.getModel();
  if (!model) {
    return;
  }
  monaco.editor.setModelLanguage(model, GetHighlightKeyByJudgeLanguage(value));

  // 保存到本地存储
  localStorage.setItem("problem_select_language", String(value));
};

onMounted(async () => {

  // 读取zen模式设置
  const isZenMode = localStorage.getItem("problem_zen_mode") === "1";
  if (isZenMode) {
    handleZenMode();
  }

  watchHandle = watch(
    () => route.params,
    async () => {
      isDailyProblem.value = false;
      if (Array.isArray(route.params.problemKey)) {
        problemKey = route.params.problemKey[0];
      } else {
        problemKey = route.params.problemKey;
      }
      if (Array.isArray(route.params.dailyId)) {
        dailyId = route.params.dailyId[0];
      } else {
        dailyId = route.params.dailyId;
      }
      if (Array.isArray(route.params.contestId)) {
        contestId = Number(route.params.contestId[0]);
      } else {
        contestId = Number(route.params.contestId);
      }
      if (!problemKey && dailyId) {
        problemLoading.value = true;
        await loadDailyData();
        problemLoading.value = false;
      }
      if (!problemKey) {
        if (contestId) {
          if (Array.isArray(route.params.problemIndex)) {
            problemIndex.value = parseInt(route.params.problemIndex[0]);
          } else {
            problemIndex.value = parseInt(route.params.problemIndex);
          }
          if (!problemIndex.value) {
            ShowTextTipsError(globalProperties, "题目不存在");
            await router.push({
              name: "contest-detail",
              params: { contestId: contestId },
            });
            return;
          }
        } else {
          ShowTextTipsError(globalProperties, "题目不存在");
          if (dailyId) {
            await router.push({ name: "problem-daily-list" });
          } else {
            await router.push({ name: "problem" });
          }
        }
      }
      isContestProblem.value = !!contestId;

      problemLoading.value = true;

      await fetchProblemData();
    },
    { immediate: true }
  );

  // 从本地存储读取提交代码私有选项
  const localIsPrivate = localStorage.getItem("problem_submit_private");
  if (localIsPrivate === "1") {
    isPrivate.value = true;
  } else {
    isPrivate.value = false;
  }

  // 延迟初始化测试运行框观察者（仅在禅模式下）
  if (isZenMode) {
    nextTick(() => {
      initTestRunContainerObserver();
      // 延迟计算高度，确保DOM更新完成
      setTimeout(() => {
        calculateEditorHeight();
      }, 200);
    });
  }

  // 监听窗口大小变化
  window.addEventListener('resize', calculateEditorHeight);
});

onBeforeUnmount(() => {
  if (watchHandle) {
    watchHandle();
    watchHandle = null;
  }
  clearDailyTimer();
  
  // 清理观察者和事件监听器
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (testRunResizeObserver) {
    testRunResizeObserver.disconnect();
    testRunResizeObserver = null;
  }
  
  window.removeEventListener('resize', calculateEditorHeight);
});
</script>

<template>
  <t-loading :loading="problemLoading">
    <div class="dida-main-content" :class="{ 'zen-mode': isZenMode }">

      <div class="dida-col-code">
        <div class="dida-code-submit-div">
          <t-form layout="inline">
            <t-form-item>
              <t-button @click="handleZenMode" theme="danger">退出禅模式</t-button>
            </t-form-item>
            <t-form-item label="是否隐藏代码">
              <t-switch v-model="isPrivate" @change="handlePrivateChanged"> </t-switch>
            </t-form-item>
            <t-form-item label="语言">
              <t-select v-model="selectLanguage" placeholder="请选择提交语言" auto-width clearable
                @change="onSelectLanguageChanged">
                <t-option v-for="item in languageOptions" :key="item.value" :value="item.value"
                  :label="item.label"></t-option>
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-space>
                <t-button @click="handleSubmitCode" :loading="problemSubmitting">提交</t-button>
                <t-button @click="handleClickResetCode" theme="danger">重置</t-button>
              </t-space>
            </t-form-item>
          </t-form>
          <div class="dida-code-editor-zen-div" ref="codeEditRefZen">
          </div>
        </div>

        <!-- 拖拽分隔符 -->
        <div class="drag-resize-handle" @mousedown="startDrag"></div>

        <!-- 测试运行框 -->
        <div class="test-run-container" ref="testRunContainerRef">
          <div class="test-run-header">
            <div class="test-run-title">测试运行</div>
            <div class="test-run-actions">
              <t-button @click="handleTestRun" :loading="testRunning" theme="primary" size="small">运行</t-button>
            </div>
          </div>
          <div class="test-run-content">
            <div class="test-input-section">
              <div class="test-input-label">输入数据：</div>
              <t-textarea v-model="testInput" placeholder="请输入测试数据..." :autosize="{ minRows: 3, maxRows: 8 }"
                class="test-input-area" />
            </div>
            <div class="test-output-section">
              <div class="test-output-label">运行结果：</div>
              <t-textarea :model-value="testOutput" placeholder="运行结果将在这里显示..." :autosize="{ minRows: 3, maxRows: 8 }"
                class="test-output-area" readonly />
            </div>
          </div>
        </div>

      </div>
      <div class="dida-col-left">

        <transition name="slide-down">
          <div v-if="isZenMode">
            <div class="dida-problems-container" v-if="contestId">
              <t-space style="flex-wrap: wrap">
                <t-button v-for="(item, index) in contestProblems" :key="index"
                  :theme="item == problemIndex ? 'primary' : 'default'"
                  @click="async () => await handleGotoContestProblem(contestId, item)">
                  {{ GetContestProblemIndexStr(item) }}
                </t-button>
              </t-space>
            </div>

            <!-- 禅模式下的题目信息面板 -->
            <div v-if="problemData" class="dida-zen-problem-info">
              <!-- 主标题 -->
              <div class="dida-zen-main-title">
                <span class="dida-zen-title-text">{{ problemData?.title }}</span>
                <span class="dida-zen-key" v-if="problemData?.key">{{ problemData?.key }}</span>
              </div>

              <!-- 第一行：时间、内存、判题信息 -->
              <div class="dida-zen-key-info-row">
                <span class="dida-zen-info-item">
                  <span class="dida-zen-label">时间:</span>
                  <span class="dida-zen-value">{{ problemData?.timeLimit }}</span>
                </span>
                <span class="dida-zen-info-item">
                  <span class="dida-zen-label">内存:</span>
                  <span class="dida-zen-value">{{ problemData?.memoryLimit }}</span>
                </span>
                <span class="dida-zen-info-item">
                  <span class="dida-zen-label">判题:</span>
                  <span class="dida-zen-value">{{ problemData?.judgeType }}</span>
                </span>
              </div>

              <!-- 第二行：标签信息（如果存在） -->
              <div class="dida-zen-tags-row" v-if="problemData?.tags && problemData?.tags.length > 0">
                <div class="dida-zen-tags-container">
                  <span class="dida-zen-info-item">
                    <span class="dida-zen-label">标签:</span>
                    <t-tag v-for="tag in problemData?.tags" :key="tag.id" size="small" variant="outline"
                      @click="() => handleClickTag(tag)" class="dida-zen-tag">
                      {{ tag.name }}
                    </t-tag>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <t-card style="margin: 10px" :style="{ marginTop: isZenMode ? '0' : '10px' }">
          <md-preview :model-value="problemDescription" previewTheme="cyanosis" />
        </t-card>
        <t-card style="margin: 10px" v-if="isDailyProblem" title="题解">
          <SecretPanel v-if="dailySolutionUnlockCountdown < 0">
            <md-preview :model-value="dailySolution" previewTheme="cyanosis" />
          </SecretPanel>
          <div style="text-align: center" v-else>
            <div>
              <t-space>
                <p>距离解锁百分比</p>
                <t-progress theme="circle" :color="{ from: '#0052D9', to: '#00A870' }"
                  :percentage="100 - (dailySolutionUnlockCountdown / (18 * 60 * 60)) * 100" :status="'active'">
                  <template #label>{{ (100 - (dailySolutionUnlockCountdown / (18 * 60 * 60)) * 100).toFixed(3) }}%
                  </template>
                </t-progress>
              </t-space>
            </div>
          </div>
        </t-card>
        <t-card style="margin: 10px" v-if="isDailyProblem" title="示例代码">
          <SecretPanel v-if="dailyCodeUnlockCountdown < 0">
            <md-preview :model-value="dailyCode" previewTheme="cyanosis" />
          </SecretPanel>
          <div style="text-align: center" v-else>
            <div>
              <t-space style="margin: 0 auto">
                <p>距离解锁百分比</p>
                <t-progress theme="circle" :color="{ from: '#0052D9', to: '#00A870' }"
                  :percentage="100 - (dailyCodeUnlockCountdown / (24 * 60 * 60)) * 100" :status="'active'">
                  <template #label>{{ (100 - (dailyCodeUnlockCountdown / (24 * 60 * 60)) * 100).toFixed(3) }}%
                  </template>
                </t-progress>
              </t-space>
            </div>
          </div>
        </t-card>

        <!-- 详细信息面板 -->
        <div class="dida-zen-detail-info-panel" v-if="isZenMode">

          <!-- 统计信息 -->
          <div class="dida-detail-stats" v-if="!isContestProblem">
            <div class="dida-detail-section-title">统计数据</div>
            <div class="dida-detail-grid">
              <div class="dida-detail-row">
                <span class="dida-detail-label">正确:</span>
                <span class="dida-detail-value">{{ problemData?.accept }}</span>
              </div>
              <div class="dida-detail-row">
                <span class="dida-detail-label">总计:</span>
                <span class="dida-detail-value">{{ problemData?.attempt }}</span>
              </div>
              <div class="dida-detail-row" v-if="problemData?.accept && problemData?.attempt">
                <span class="dida-detail-label">通过率:</span>
                <span class="dida-detail-value">{{ ((problemData?.accept / problemData?.attempt) * 100).toFixed(1)
                }}%</span>
              </div>
            </div>
          </div>

          <!-- 作者和来源信息 -->
          <div class="dida-detail-meta">
            <div class="dida-detail-section-title">作者信息</div>
            <div class="dida-detail-grid">
              <div class="dida-detail-row">
                <span class="dida-detail-label">上传用户:</span>
                <span class="dida-detail-value">
                  {{ problemData?.inserterNickname ? problemData?.inserterNickname : problemData?.originAuthor }}
                </span>
              </div>
              <div class="dida-detail-row" v-if="!isContestProblem && problemData?.source">
                <span class="dida-detail-label">题目来源:</span>
                <span class="dida-detail-value">{{ problemData?.source }}</span>
              </div>
              <div class="dida-detail-row" v-if="hasEditAuth">
                <span class="dida-detail-label">权限:</span>
                <span class="dida-detail-value">{{ problemData?.private ? "私有" : "公开" }}</span>
              </div>
            </div>
          </div>

          <!-- 时间信息 -->
          <div class="dida-detail-time">
            <div class="dida-detail-section-title">时间信息</div>
            <div class="dida-detail-grid">
              <div class="dida-detail-row">
                <span class="dida-detail-label">创建时间:</span>
                <span class="dida-detail-value">{{ problemData?.insertTime }}</span>
              </div>
              <div class="dida-detail-row">
                <span class="dida-detail-label">编辑时间:</span>
                <span class="dida-detail-value">{{ problemData?.modifyTime }}</span>
              </div>
            </div>
          </div>

          <!-- 原题链接 -->
          <div class="dida-detail-origin" v-if="problemData?.originUrl">
            <div class="dida-detail-section-title">原题信息</div>
            <div class="dida-detail-row">
              <span class="dida-detail-label">原题链接:</span>
              <t-link :href="problemData?.originUrl" target="_blank" class="dida-detail-link">
                {{ problemData?.originOj }} - {{ problemData?.originId }}
              </t-link>
            </div>
          </div>
        </div>

      </div>
      <div class="dida-col-right">
        <div class="dida-problems-container" v-if="contestId">
          <t-space style="flex-wrap: wrap">
            <t-button v-for="(item, index) in contestProblems" :key="index"
              :theme="item == problemIndex ? 'primary' : 'default'"
              @click="async () => await handleGotoContestProblem(contestId, item)">
              {{ GetContestProblemIndexStr(item) }}
            </t-button>
          </t-space>
        </div>
        <div style="margin: 12px">
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="标识" v-if="problemData?.key">{{ problemData?.key }}</t-descriptions-item>
            <t-descriptions-item label="标题">{{ problemData?.title }}</t-descriptions-item>
            <t-descriptions-item label="时间限制">{{ problemData?.timeLimit }}</t-descriptions-item>
            <t-descriptions-item label="内存限制">{{ problemData?.memoryLimit }}</t-descriptions-item>
            <t-descriptions-item label="判题方式">{{ problemData?.judgeType }}</t-descriptions-item>
            <t-descriptions-item label="正确提交" v-if="!isContestProblem">{{ problemData?.accept }} </t-descriptions-item>
            <t-descriptions-item label="提交总数" v-if="!isContestProblem">{{ problemData?.attempt }} </t-descriptions-item>
            <t-descriptions-item label="创建时间">{{ problemData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="编辑时间">{{ problemData?.modifyTime }}</t-descriptions-item>
            <t-descriptions-item label="上传用户">{{
              problemData?.inserterNickname ? problemData?.inserterNickname : problemData?.originAuthor
            }}</t-descriptions-item>
            <t-descriptions-item label="题目来源" v-if="!isContestProblem">
              <t-link v-if="problemData?.sourceUrl" :href="problemData?.sourceUrl" target="_blank">
                {{ problemData?.source }}
              </t-link>
              <span v-else>
                {{ problemData?.source }}
              </span>
            </t-descriptions-item>
            <t-descriptions-item label="是否私有" v-if="hasEditAuth">{{ problemData?.private ? "私有" : "公开" }}
            </t-descriptions-item>
            <t-descriptions-item v-if="problemData?.originUrl" label="原题链接">
              <t-link :href="problemData?.originUrl" target="_blank">
                {{ problemData?.originOj }} -
                {{ problemData?.originId }}
              </t-link>
            </t-descriptions-item>
            <t-descriptions-item label="标签" v-if="problemKey">
              <t-button class="dida-tag-button" v-for="tag in problemData?.tags" :key="tag.id" variant="dashed"
                size="small" @click="() => handleClickTag(tag)">
                {{ tag.name }}
              </t-button>
            </t-descriptions-item>
          </t-descriptions>

          <div class="dida-operation-container">
            <t-space>
              <t-button @click="handleClickJudgeStatus">提交记录</t-button>
              <t-button @click="handleClickDiscuss">题目讨论</t-button>
              <t-button @click="handleClickStatistics" v-if="problemKey">题目统计</t-button>
              <t-button @click="handleClickRecommend" v-if="problemKey">题目推荐</t-button>
            </t-space>
          </div>
          <div class="dida-operation-container"
            v-if="(isDailyProblem && hasEditDailyAuth) || hasEditAuth || problemData?.originId">
            <t-space>
              <t-button v-if="isDailyProblem && hasEditDailyAuth" @click="handleClickDailyEdit">每日一题</t-button>
              <t-button v-if="hasEditAuth" @click="handleClickEdit">编辑</t-button>
              <t-button v-if="problemData?.originId" @click="handleClickCrawl" :loading="problemCrawlLoading">更新描述
              </t-button>
            </t-space>
          </div>

          <div class="dida-code-submit-div" v-if="isLogin">
            <t-form layout="inline">
              <t-form-item label="语言">
                <t-select v-model="selectLanguage" placeholder="请选择提交语言" auto-width clearable
                  @change="onSelectLanguageChanged">
                  <t-option v-for="item in languageOptions" :key="item.value" :value="item.value"
                    :label="item.label"></t-option>
                </t-select>
              </t-form-item>
              <t-form-item label="是否隐藏代码">
                <t-switch v-model="isPrivate" @change="handlePrivateChanged"> </t-switch>
              </t-form-item>
              <t-form-item>
                <t-button @click="handleZenMode">禅模式</t-button>
              </t-form-item>
              <t-form-item>
                <t-space>
                  <t-button @click="handleSubmitCode" :loading="problemSubmitting">提交</t-button>
                  <t-button @click="handleClickResetCode" theme="danger">重置</t-button>
                </t-space>
              </t-form-item>
            </t-form>
            <div class="dida-code-editor-div" ref="codeEditRef">
            </div>
          </div>
          <div style="text-align: center" v-else>
            <t-space>
              <t-button @click="() => handleGotoLogin(router, route.fullPath)">登录后提交本题</t-button>
            </t-space>
          </div>
        </div>
      </div>
    </div>
  </t-loading>
</template>

<style scoped>
.dida-main-content {
  display: block;
  overflow-y: auto;
}

.dida-main-content.zen-mode {
  height: calc(100vh - 57px);
}

.dida-col-code {
  width: 0;
  min-width: 0;
  transition: all 0.3s ease;
  overflow: hidden;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  float: left;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.dida-main-content.zen-mode .dida-col-code {
  width: 50%;
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}

.dida-col-left {
  width: 60%;
  min-width: 0;
  transition: width 0.3s ease;
  float: left;
  height: 100%;
  position: relative;
}

/* 禅模式下的布局 */
.dida-main-content.zen-mode .dida-col-left {
  width: 50%;
  overflow-y: auto;
  height: calc(100vh - 57px);
}

.dida-col-right {
  width: 40%;
  min-width: 300px;
  transition: width 0.3s ease;
  float: left;
  height: 100%;
  position: relative;
}

/* 禅模式下隐藏右侧栏 - 完全隐藏并释放空间 */
.dida-main-content.zen-mode .dida-col-right {
  width: 0;
  min-width: 0;
  padding: 0;
  margin: 0;
  border: none;
  overflow: hidden;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateX(100%);
  transition: all 0.3s ease;
  position: absolute;
  z-index: -1;
}

/* 正常模式下恢复可见性 */
.dida-col-right {
  visibility: visible;
  opacity: 1;
  transition: all 0.3s ease;
}

.dida-operation-container {
  margin: 10px 0 20px;
  text-align: right;
}

.dida-problems-container {
  margin: 20px;
}

.dida-code-submit-div {
  margin-top: 10px;
  flex-shrink: 0;
}

.dida-code-editor-div {
  width: 100%;
  margin-top: 10px;
  height: 500px;
  position: relative;
}

.dida-code-editor-zen-div {
  width: 100%;
  margin-top: 10px;
  min-height: 300px;
  height: calc(100vh - 56px);
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 禅模式题目信息面板样式 */
.dida-zen-problem-info {
  margin: 8px 10px 10px 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

/* 主标题样式 */
.dida-zen-main-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.dida-zen-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.dida-zen-key {
  font-size: 11px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* 紧凑信息行 - 两行布局 */
.dida-zen-compact-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dida-zen-key-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.dida-zen-info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  font-weight: 400;
}

.dida-zen-label {
  color: #999;
  margin-right: 4px;
}

.dida-zen-value {
  color: #333;
  font-weight: 500;
}

/* 详细信息区域 */
.dida-zen-detail-info {
  font-size: 11px;
}

/* 统计信息行 */
.dida-zen-stats-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.dida-zen-stat-tag {
  font-size: 10px !important;
  height: 18px !important;
  line-height: 16px !important;
  padding: 0 4px !important;
}

/* 原题链接行 */
.dida-zen-origin-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.dida-zen-origin-link {
  font-size: 11px !important;
  margin-left: 2px;
}

/* 标签区域 */
.dida-zen-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.dida-zen-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 100%;
}

.dida-zen-tag {
  font-size: 11px;
  padding: 2px 6px;
  margin: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
  color: #595959;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dida-zen-tag:hover {
  background-color: #0052d9;
  color: white;
  border-color: #0052d9;
}

/* 详细信息面板样式 */
.dida-zen-detail-info-panel {
  margin-top: 20px;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
  border-radius: 8px;
}

.dida-detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  border-left: 3px solid #0052d9;
  padding-left: 8px;
}

.dida-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px 16px;
  margin-bottom: 8px;
}

.dida-detail-row {
  display: flex;
  align-items: center;
  min-height: 24px;
}

.dida-detail-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  margin-right: 8px;
  min-width: 70px;
  text-align: right;
  flex-shrink: 0;
}

.dida-detail-value {
  font-size: 13px;
  color: #333;
  font-weight: 400;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dida-detail-link {
  font-size: 13px !important;
}

.dida-detail-stats,
.dida-detail-meta,
.dida-detail-time,
.dida-detail-origin {
  margin-bottom: 20px;
}

.dida-detail-stats:last-child,
.dida-detail-meta:last-child,
.dida-detail-time:last-child,
.dida-detail-origin:last-child {
  margin-bottom: 0;
}

/* 动画效果 */
.slide-down-enter-active {
  transition: all 0.3s ease-out;
}

.slide-down-leave-active {
  transition: all 0.3s ease-in;
}

.slide-down-enter-from {
  transform: translateY(-20px);
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.slide-down-enter-to,
.slide-down-leave-from {
  transform: translateY(0);
  opacity: 1;
  max-height: 200px;
}
</style>

<script setup lang="tsx">
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount, type WatchStopHandle } from "vue";
import Vditor from "vditor";
import { useRoute } from "vue-router";
import router from "@/router";
import { enhanceCodeCopy } from "@/util/v-copy-code.ts";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsError, useCurrentInstance } from "@/util";
import { GetDiscuss, ParseDiscuss, GetDiscussCommentList, ParseDiscussComment } from "@/apis/discuss.ts";
import { DiscussComment, DiscussCommentView, DiscussTag, DiscussView } from "@/types/discuss.ts";
import { handleGotoUsername } from "@/util/router.ts";

import { useWebStyleStore } from "@/stores/webStyle.ts";

import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";
import { GetContestProblemIndexStr } from "@/apis/contest.ts";

const props = defineProps<{ discussId?: string }>();

let route = useRoute();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;

const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let content = ref("");
const discussId = ref("");
const markdownRef = ref<HTMLElement | null>(null);
const discussLoading = ref(false);
const discussData = ref<DiscussView | null>(null);

const dataLoading = ref(false);
let descriptionEditor = null as Vditor | null;

let currentPage = 1;
let currentPageSize = 20;

const pagination = ref({
  current: 1,
  total: 0,
  defaultPageSize: currentPageSize,
  defaultCurrent: currentPage,
  pageSizeOptions: [20, 50],
});

const discussCommentList = ref([] as DiscussCommentView[]);

const tagsMap = {} as { [key: number]: DiscussTag };

const hasEditAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageDiscuss);
});

const handleClickTag = (tag: DiscussTag) => {
  if (!tag) {
    return;
  }
  router.push({
    name: "discuss-list",
    query: {
      ...route.query,
      title: "",
      tag: tag.name,
    },
  });
};

const handleClickEdit = () => {
  router.push({
    name: "manage-discuss",
    params: {
      discussId: discussId.value,
    },
  });
};

const renderCommentTotalContent = () => {
  return <div class="t-pagination__total">{`共 ${pagination.value.total} 条回复`}</div>;
};

const handleSaveReply = () => {};

const fetchCommentList = async (paginationInfo: { current: number; pageSize: number }, needLoading: boolean) => {
  if (needLoading) {
    dataLoading.value = true;
  }
  try {
    const { current, pageSize } = paginationInfo;
    const res = await GetDiscussCommentList(discussId.value, current, pageSize);
    discussCommentList.value = [];
    if (res.code === 0) {
      const responseList = res.data.list as DiscussComment[];
      if (responseList) {
        for (let i = 0; i < responseList.length; i++) {
          const item = responseList[i];
          const result = await ParseDiscussComment(item);
          discussCommentList.value?.push(result);

          await nextTick(() => {
            const discussContents = document.querySelectorAll(".dida-discuss-content");
            if (discussContents && discussContents.length > 0) {
              discussContents.forEach((content: any) => {
                Vditor.mathRender(content);
                Vditor.highlightRender({ lineNumber: true, enable: true }, content);
                enhanceCodeCopy(content);
              });
            }
          });
        }
      }
      pagination.value = { ...pagination.value, total: res.data.total_count };
    } else {
      if (needLoading) {
        ShowErrorTips(globalProperties, res.code);
      }
    }
  } catch (err) {
    console.error(err);
    if (needLoading) {
      ShowErrorTips(globalProperties, GetCommonErrorCode());
    }
  } finally {
    if (needLoading) {
      dataLoading.value = false;
    }
  }
};

const onPageChange = async (pageInfo: { current: number; pageSize: number }) => {
  // 更新 URL 查询参数
  await router.push({
    query: { ...route.query, page: pageInfo.current, page_size: pageInfo.pageSize },
  });
};

onMounted(async () => {
  viewActive = true;

  discussId.value = props.discussId;
  if (!discussId.value) {
    if (Array.isArray(route.params.discussId)) {
      discussId.value = route.params.discussId[0];
    } else {
      discussId.value = route.params.discussId;
    }
  }
  if (!discussId.value) {
    ShowTextTipsError(globalProperties, "讨论不存在");
    await router.push({ name: "discuss" });
    return;
  }

  discussLoading.value = true;

  const res = await GetDiscuss(discussId.value);
  if (res.code !== 0) {
    discussLoading.value = false;
    ShowErrorTips(globalProperties, res.code);
    await router.push({ name: "discuss" });
    return;
  }

  if (res.data.tags) {
    res.data.tags.forEach((tag: DiscussTag) => {
      tagsMap[tag.id] = tag;
    });
  }

  discussData.value = ParseDiscuss(res.data.discuss, tagsMap);

  webStyleStore.setTitle(discussData.value.title + " - " + webStyleStore.getTitle);

  let discussDescription = discussData.value.content as string;

  const options = {
    math: {
      inlineDigit: true,
      engine: "KaTeX",
    },
  } as IPreviewOptions;
  content.value = await Vditor.md2html(discussDescription, options);
  await nextTick(() => {
    if (markdownRef.value) {
      Vditor.mathRender(markdownRef.value);
      Vditor.highlightRender({ lineNumber: true, enable: true }, markdownRef.value);
      enhanceCodeCopy(markdownRef.value);
    }
    discussLoading.value = false;
  });

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
      const queryPage = parseInt(newQuery.page as string) || pagination.value.defaultCurrent;
      const queryPageSize = parseInt(newQuery.page_size as string) || pagination.value.defaultPageSize;
      currentPage = queryPage;
      currentPageSize = queryPageSize;
      pagination.value = { ...pagination.value, current: currentPage, pageSize: currentPageSize };
      fetchCommentList({ current: currentPage, pageSize: currentPageSize }, true);
    },
    { immediate: true }
  );

  const codeEditOptions = {
    after: () => {},
  } as IOptions;
  descriptionEditor = new Vditor("commentEditRef", codeEditOptions);
});

onBeforeUnmount(() => {
  viewActive = false;

  if (watchHandle) {
    watchHandle();
  }
});
</script>

<template>
  <t-loading :loading="discussLoading">
    <t-row class="dida-main-content">
      <t-col :span="8">
        <div style="margin: 20px" v-if="discussData?.problemTitle || discussData?.contestTitle">
          <t-breadcrumb max-item-width="300">
            <template v-if="discussData?.contestTitle">
              <t-breadcrumb-item :to="{ name: 'contest-detail', params: { contestId: discussData?.contestId } }">
                {{ discussData?.contestTitle }}
              </t-breadcrumb-item>
              <t-breadcrumb-item
                v-if="discussData?.contestProblemIndex"
                :to="{ name: 'contest-problem-detail', params: { problemIndex: discussData?.contestProblemIndex } }"
              >
                {{ GetContestProblemIndexStr(discussData?.contestProblemIndex) }} - {{ discussData?.problemTitle }}
              </t-breadcrumb-item>
            </template>
            <template v-else>
              <t-breadcrumb-item :to="{ name: 'discuss-list-problem' }"> 问题讨论</t-breadcrumb-item>
              <t-breadcrumb-item :to="{ name: 'problem-detail', params: { problemId: discussData?.problemId } }">
                {{ discussData?.problemTitle }}
              </t-breadcrumb-item>
            </template>
          </t-breadcrumb>
        </div>

        <t-card style="margin: 10px" :header="discussData?.title" :header-bordered="true">
          <div v-html="content" class="dida-discuss-content"></div>
        </t-card>
        <t-card v-for="(comment, index) in discussCommentList" :key="index" style="margin: 10px" header-bordered>
          <template #header>
            <t-space>
              <span>{{ comment.authorNickname }}</span>
              <span>{{ comment.insertTime }}</span>
            </t-space>
          </template>
          <div v-html="comment.content" class="dida-discuss-content"></div>
        </t-card>
        <div style="margin: 10px">
          <t-pagination
            v-model="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-size-options="pagination.pageSizeOptions"
            :show-page-size="false"
            :total-content="renderCommentTotalContent"
            @change="onPageChange"
          />
        </div>

        <div style="margin: 10px">
          <div id="commentEditRef" class="dida-comment-editor"></div>
          <div style="margin: 10px; text-align: right">
            <t-space>
              <t-button theme="primary" @click="handleSaveReply">提交</t-button>
            </t-space>
          </div>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div v-if="hasEditAuth" class="dida-edit-container">
            <t-button @click="handleClickEdit">编辑</t-button>
          </div>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="创建时间">{{ discussData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="编辑时间">{{ discussData?.modifyTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ discussData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="创建用户"> <t-button variant="text" @click="async () => await handleGotoUsername(router, discussData?.authorUsername)">
              {{ discussData?.authorNickname }}
            </t-button></t-descriptions-item>
            <t-descriptions-item label="标签">
              <t-space>
                <t-button v-for="tag in discussData?.tags" :key="tag.id" variant="dashed" @click="() => handleClickTag(tag)">
                  {{ tag.name }}
                </t-button>
              </t-space>
            </t-descriptions-item>
          </t-descriptions>
        </div>
      </t-col>
    </t-row>
  </t-loading>
</template>

<style scoped>
.dida-main-content {
  min-height: 800px;
}

.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}

.dida-comment-editor {
  min-height: 300px;
  z-index: 9999 !important;
}
</style>

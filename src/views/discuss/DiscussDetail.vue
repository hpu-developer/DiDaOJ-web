<script setup lang="tsx">
import { ref, computed, onMounted, watch, onBeforeUnmount, type WatchStopHandle } from "vue";
import { useRoute } from "vue-router";
import router from "@/router";
import { GetCommonErrorCode, ShowErrorTips, ShowTextTipsError, ShowTextTipsSuccess, useCurrentInstance } from "@/util";
import {
  GetDiscuss,
  ParseDiscuss,
  GetDiscussCommentList,
  ParseDiscussComment,
  GetDiscussCommentImageToken,
  PostDiscussCommentCreate,
  PostDiscussCommentEdit,
} from "@/apis/discuss.ts";
import type { DiscussComment, DiscussCommentEditRequest, DiscussCommentView, DiscussView } from "@/types/discuss.ts";
import { handleOpenUsername } from "@/util/router.ts";

import { useWebStyleStore } from "@/stores/webStyle.ts";

import { useUserStore } from "@/stores/user.ts";
import { AuthType } from "@/auth";
import { GetContestProblemIndexStr } from "@/apis/contest.ts";
import { HandleR2ImageUpload, UploadImageCallbackUrl } from "@/util/md-editor-v3.ts";

const props = defineProps<{ discussId?: string }>();

let route = useRoute();
const { globalProperties } = useCurrentInstance();

let viewActive = false;
let watchHandle: WatchStopHandle | null = null;

const webStyleStore = useWebStyleStore();
const userStore = useUserStore();

let discussContent = ref("");
const discussId = ref(0);
const discussLoading = ref(false);
const discussData = ref<DiscussView | null>(null);

const dataLoading = ref(false);

const commentSubmitting = ref(false);
const editCommentId = ref(0);
const editCommentContent = ref("");

let currentPage = 1;
let currentPageSize = 20;

const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  defaultPageSize: currentPageSize,
  defaultCurrent: currentPage,
  pageSizeOptions: [20, 50],
});

const discussCommentList = ref([] as DiscussCommentView[]);

const hasManageDiscussAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageDiscuss);
});

const hasEditDiscussAuth = computed(() => {
  return userStore.hasAuth(AuthType.ManageDiscuss) || (discussData.value && userStore.getUserId == discussData.value.inserter);
});

const handleClickEdit = () => {
  router.push({
    name: "discuss-edit",
    params: {
      discussId: discussId.value,
    },
  });
};

const renderCommentTotalContent = () => {
  return <div class="t-pagination__total">{`共 ${pagination.value.total} 条回复`}</div>;
};

const handleGotoEditComment = (id: number, content: string) => {
  editCommentId.value = id;
  editCommentContent.value = content;
  const discussEditor = document.getElementById("discuss-comment-editor");
  if (discussEditor) {
    discussEditor.scrollIntoView({ behavior: "smooth" });
  }
};

const handleClickClear = () => {
  editCommentId.value = 0;
  editCommentContent.value = "";
  const discussEditor = document.getElementById("discuss-comment-editor");
  if (discussEditor) {
    discussEditor.scrollIntoView({ behavior: "smooth" });
  }
};

const handleSaveReply = async () => {
  commentSubmitting.value = true;

  try {
    let res;
    if (editCommentId.value) {
      const postData = {
        id: editCommentId.value,
        discuss_id: discussId.value,
        content: editCommentContent.value,
      } as DiscussCommentEditRequest;
      res = await PostDiscussCommentEdit(postData);
      if (res.code !== 0) {
        ShowErrorTips(globalProperties, res.code);
        return;
      }

      ShowTextTipsSuccess(globalProperties, "编辑成功");

      editCommentId.value = 0;
      editCommentContent.value = "";

      if (currentPage === 1) {
        await fetchCommentList({ current: 1, pageSize: currentPageSize }, true);
      } else {
        await router.push({
          query: {
            current: 1,
          },
        });
      }
      const commentDivider = document.getElementById("comment-divider");
      if (commentDivider) {
        commentDivider.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      const postData = {
        discuss_id: discussId.value,
        content: editCommentContent.value,
      } as DiscussCommentEditRequest;
      res = await PostDiscussCommentCreate(postData);
      if (res.code !== 0) {
        ShowErrorTips(globalProperties, res.code);
        return;
      }

      ShowTextTipsSuccess(globalProperties, "编辑成功");

      editCommentId.value = 0;
      editCommentContent.value = "";

      if (currentPage === 1) {
        await fetchCommentList({ current: 1, pageSize: currentPageSize }, true);
      } else {
        await router.push({
          query: {
            current: 1,
          },
        });
      }
      const commentDivider = document.getElementById("comment-divider");
      if (commentDivider) {
        commentDivider.scrollIntoView({ behavior: "smooth" });
      }
    }
  } finally {
    commentSubmitting.value = false;
  }
};

const handleUploadImg = async (files: File[], callback: (urls: UploadImageCallbackUrl[]) => void) => {
  commentSubmitting.value = true;
  await HandleR2ImageUpload(files, callback, globalProperties, () => {
    return GetDiscussCommentImageToken(discussId.value, editCommentId.value);
  });
  commentSubmitting.value = false;
};

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
          const result = ParseDiscussComment(item);
          discussCommentList.value?.push(result);
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

  discussId.value = Number(props.discussId);
  if (!discussId.value) {
    if (Array.isArray(route.params.discussId)) {
      discussId.value = Number(route.params.discussId[0]);
    } else {
      discussId.value = Number(route.params.discussId);
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

  discussData.value = ParseDiscuss(res.data.discuss);

  webStyleStore.setTitle(discussData.value.title + " - " + webStyleStore.getTitle);

  discussContent.value = discussData.value.content as string;

  discussLoading.value = false;

  watchHandle = watch(
    () => route.query,
    (newQuery) => {
      if (!viewActive) {
        return;
      }
      const queryPage = parseInt(newQuery.page as string) || pagination.value.defaultCurrent;
      const queryPageSize = parseInt(newQuery.page_size as string) || pagination.value.defaultPageSize;
      currentPage = queryPage;
      currentPageSize = queryPageSize;
      pagination.value = { ...pagination.value, current: currentPage, pageSize: currentPageSize };
      fetchCommentList({ current: currentPage, pageSize: currentPageSize }, true);
    },
    { immediate: true }
  );
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
              <t-breadcrumb-item :to="{ name: 'discuss-list-problem' }"> 题目讨论</t-breadcrumb-item>
              <t-breadcrumb-item :to="{ name: 'problem-detail', params: { problemId: discussData?.problemId } }">
                {{ discussData?.problemTitle }}
              </t-breadcrumb-item>
            </template>
          </t-breadcrumb>
        </div>

        <t-card style="margin: 10px" :header="discussData?.title" :header-bordered="true">
          <md-preview :model-value="discussContent" previewTheme="cyanosis"></md-preview>
        </t-card>
        <t-divider id="comment-divider">评论区</t-divider>
        <t-card v-for="(comment, index) in discussCommentList" :key="index" style="margin: 10px" header-bordered>
          <template #header>
            <div class="dida-operation-container">
              <t-space>
                <t-avatar shape="round" size="32px" :image="comment?.avatarUrl" :hide-on-load-failed="false" />
                <t-button
                  variant="text"
                  @click="
                    () => {
                      handleOpenUsername(router, comment.inserterUsername);
                    }
                  "
                  >{{ comment.inserterNickname }}</t-button
                >
                <span style="line-height: 32px">{{ comment.insertTime }}</span>
              </t-space>
            </div>
            <div class="dida-operation-container">
              <t-space>
                <t-button
                  v-if="hasManageDiscussAuth || userStore.getUserId === comment.inserter"
                  @click="
                    () => {
                      handleGotoEditComment(comment.id, comment.content);
                    }
                  "
                >
                  编辑
                </t-button>
              </t-space>
            </div>
          </template>
          <md-preview :model-value="comment.content" previewTheme="cyanosis" />
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
        <t-divider></t-divider>
        <div style="margin: 10px">
          <div style="margin: 10px" class="dida-operation-container">
            <t-tag style="margin: 10px">{{ editCommentId ? "编辑回复" : "发表回复" }}</t-tag>
            <t-space>
              <t-button theme="danger" @click="handleClickClear">清除</t-button>
              <t-button theme="primary" @click="handleSaveReply" :loading="commentSubmitting">提交</t-button>
            </t-space>
          </div>
          <md-editor-v3
            id="discuss-comment-editor"
            v-model="editCommentContent"
            previewTheme="cyanosis"
            @save="handleSaveReply"
            @onUploadImg="handleUploadImg"
          ></md-editor-v3>
          <t-loading :loading="commentSubmitting" attach="#discuss-comment-editor" :z-index="100000"></t-loading>
        </div>
      </t-col>
      <t-col :span="4">
        <div style="margin: 12px">
          <div v-if="hasEditDiscussAuth" class="dida-edit-container">
            <t-button @click="handleClickEdit">编辑</t-button>
          </div>
          <t-descriptions layout="vertical" :bordered="true">
            <t-descriptions-item label="创建用户">
              <t-button variant="text" @click="async () => await handleOpenUsername(router, discussData?.inserterUsername)">
                {{ discussData?.inserterNickname }}
              </t-button>
            </t-descriptions-item>
            <t-descriptions-item label="头像">
              <t-avatar shape="round" size="100px" :image="discussData?.avatarUrl" :hide-on-load-failed="false" />
            </t-descriptions-item>
            <t-descriptions-item label="创建时间">{{ discussData?.insertTime }}</t-descriptions-item>
            <t-descriptions-item label="编辑时间">{{ discussData?.modifyTime }}</t-descriptions-item>
            <t-descriptions-item label="更新时间">{{ discussData?.updateTime }}</t-descriptions-item>
            <t-descriptions-item label="标签"></t-descriptions-item>
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

.dida-operation-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dida-edit-container {
  margin: 10px 0;
  text-align: right;
}
</style>

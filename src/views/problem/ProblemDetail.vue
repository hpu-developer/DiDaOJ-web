<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import Vditor from "vditor";
import { useRoute } from "vue-router";
import router from "@/router";

let route = useRoute();

let content = ref("");
const problemId = ref("");
const markdownRef = ref<HTMLElement | null>(null);
const codeEditRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  if (route.params.problemId && route.params.problemId.length === 1) {
    problemId.value = route.params.problemId[0];
  } else {
    await router.push({ name: "problem" });
    return;
  }

  const options = {
    math: {
      inlineDigit: true,
      engine: "KaTeX",
    },
  } as IPreviewOptions;
  content.value = await Vditor.md2html(
    "## 题目描述\n" +
      problemId.value +
      "\n" +
      "\n$$\n" +
      "\\\\frac{1}{\n" +
      "  \\\\Bigl(\\\\sqrt{\\\\phi \\\\sqrt{5}}-\\\\phi\\\\Bigr) e^{\n" +
      "  \\\\frac25 \\\\pi}} = 1+\\\\frac{e^{-2\\\\pi}} {1+\\\\frac{e^{-4\\\\pi}} {\n" +
      "    1+\\\\frac{e^{-6\\\\pi}}\n" +
      "    {1+\\\\frac{e^{-8\\\\pi}}{1+\\\\cdots}}\n" +
      "  }\n" +
      "}\n" +
      "$$\n" +
      "Calculate A + B .\n" +
      "\n" +
      "计算 A + B 。\n" +
      "\n" +
      "## 输入\n" +
      "\n" +
      "Each line will contain two integers A and B ( $t-10^5<A,B<10^5t$ ).\n" +
      "\n" +
      "Process to end of file.\n" +
      "\n" +
      "每一行包含两个整数 A 和 B ( $-10^5<A,B<10^5$ )。\n" +
      "\n" +
      "处理到文件结束。\n" +
      "\n" +
      "（这意味着你的程序不能只计算一次 $A+B$ 就退出） \n" +
      "\n" +
      "## 输出\n" +
      "\n" +
      "For each case,\n" +
      "\n" +
      "output $A+B$ in one line.\n" +
      "\n" +
      "对于每组测试，\n" +
      "\n" +
      "在一行输出 $A+B$ 。\n" +
      "\n" +
      "（所以请注意行末换行） \n" +
      "\n" +
      "## 样例输入\n" +
      "\n" +
      "```\n" +
      "1 1\n" +
      "2 3\n" +
      "```\n" +
      "\n" +
      "\n" +
      "## 样例输出\n" +
      "\n" +
      "```\n" +
      "2\n" +
      "5\n" +
      "```",
    options
  );
  await nextTick(() => {
    if (markdownRef.value) {
      Vditor.mathRender(markdownRef.value);
      const codeEditOptions = {
        toolbar: ["undo", "redo"],
      } as IOptions;
      const vditor = new Vditor("codeEditRef", codeEditOptions);
    }
  });
});
</script>

<template>
  <t-row>
    <t-col :span="8">
      <t-card style="margin: 10px">
        <div v-html="content" ref="markdownRef"></div>
      </t-card>
    </t-col>
    <t-col :span="4">
      <div style="margin: 12px">
        <t-descriptions layout="vertical" :bordered="true">
          <t-descriptions-item label="标题">{{ problemId }}</t-descriptions-item>
          <t-descriptions-item label="状态"></t-descriptions-item>
        </t-descriptions>
        <div id="codeEditRef" style="margin-top: 20px"></div>
      </div>
    </t-col>
  </t-row>
</template>

<style scoped></style>

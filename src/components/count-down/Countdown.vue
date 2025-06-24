<template>
  <span>{{ result }}</span>
</template>

<script>
function fixedZero(val) {
  return val * 1 < 10 ? `0${val}` : val;
}

export default {
  name: "CountDown",
  emits: ["on-end"],
  props: {
    // 自定义显示格式
    format: {
      type: Function,
    },
    // 目标时间
    target: {
      type: [Date, Number],
      required: true,
    },
    // 自动倒计时间隔
    interval: {
      type: Number,
      default: 1000,
    },
  },
  data() {
    return {
      lastTime: 0,
      targetTime: 0,
      timer: null,
    };
  },
  computed: {
    result() {
      const { format = this.defaultFormat } = this;
      return format(this.lastTime);
    },
  },
  methods: {
    initTargetTime() {
      try {
        this.targetTime = Object.prototype.toString.call(this.target) === "[object Date]" ? this.target.getTime() : new Date(this.target).getTime();
      } catch (e) {
        throw new Error("invalid target prop", e);
      }
    },
    updateTime() {
      const now = Date.now();
      const remaining = this.targetTime - now;
      this.lastTime = remaining > 0 ? remaining : 0;
    },
    tick() {
      this.updateTime();

      if (this.lastTime <= 0) {
        clearTimeout(this.timer);
        this.timer = null;
        this.$emit("on-end");
        return;
      }

      this.timer = setTimeout(() => {
        this.tick();
      }, this.interval);
    },
    stop() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    },
    defaultFormat(time) {
      const hours = 60 * 60 * 1000;
      const minutes = 60 * 1000;

      const h = Math.floor(time / hours);
      const m = Math.floor((time % hours) / minutes);
      const s = Math.floor((time % minutes) / 1000);

      return `${fixedZero(h)}:${fixedZero(m)}:${fixedZero(s)}`;
    },
  },
  watch: {
    target() {
      this.stop();
      this.initTargetTime();
      this.tick();
    },
  },
  created() {
    this.initTargetTime();
    this.updateTime();
  },
  mounted() {
    this.tick();
  },
  beforeUnmount() {
    this.stop();
  },
};
</script>

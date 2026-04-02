<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
/* CSS Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  touch-action: manipulation;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background-color: #f5f7fa;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  min-height: 100dvh;
}

/* 移动端安全区 */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: calc(env(safe-area-inset-bottom) + 20px);
}

.safe-area-top {
  padding-top: env(safe-area-inset-top);
  padding-top: calc(env(safe-area-inset-top) + 20px);
}

/* 触控优化 */
button,
a,
[role="button"] {
  touch-action: manipulation;
}

/* 禁用选择 */
.no-select {
  user-select: none;
  -webkit-user-select: none;
}

/* 滚动优化 */
.smooth-scroll {
  -webkit-overflow-scrolling: touch;
}

/* 图片自适应 */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 响应式断点 */
@media screen and (max-width: 375px) {
  html {
    font-size: 14px;
  }
}

@media screen and (min-width: 768px) {
  html {
    font-size: 16px;
  }
}
</style>

<script setup lang="ts">
/**
 * AppFooter —— 底部信息栏
 */
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-left">
        <span class="footer-brand">幻想召唤研究所</span>
        <span class="footer-dot">·</span>
        <span class="footer-version">v1.0.0</span>
      </div>
      <div class="footer-right">
        <span class="footer-tip">小贴士：长按角色卡片可查看详细信息</span>
      </div>
      <div class="footer-copyright">
        © Fantasy Gacha Lab · All Rights Reserved.
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  position: relative;
  z-index: 2;
  padding: 20px 0;
  margin-top: 40px;
  background: linear-gradient(180deg, transparent, rgba(7, 9, 26, 0.85));
  border-top: 1px solid var(--color-border-soft);
  color: var(--color-muted);
  font-size: 12px;
}
.footer-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
}
.footer-left, .footer-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.footer-brand {
  color: var(--color-text);
  font-weight: 600;
}
.footer-dot { opacity: 0.5; }
.footer-version {
  color: var(--color-purple-bright);
}
.footer-tip {
  font-style: italic;
  opacity: 0.8;
}
.footer-copyright {
  width: 100%;
  text-align: center;
  margin-top: 8px;
  opacity: 0.6;
  font-size: 11px;
}
</style>

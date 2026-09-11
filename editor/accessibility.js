/**
 * DiagramWeave Accessibility
 *
 * 從 flowchart-editor.js 抽取的無障礙與模態契約（Phase 1 拆分第 17 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveAccessibility。
 *
 * 包含：
 * - 無障礙初始化（initAccessibility）
 * - 模態對話框契約（MODAL_OVERLAY_IDS / activateModalContract / deactivateModalContract /
 *   closeActiveModal / initModalContracts / modalFocusableElements / setModalBackgroundInert）
 * - 移動視圖（isMobileViewMode / openMobileReview）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - flowchart-editor.js 頂層函數：showReviewPanel
 * - 已提取模塊函數（closeActiveModal 調用）：cancelBranchSelector、cancelImportPreview、
 *   cancelMappingWizard、closeCommandPalette、hideConfirm、hideExcelDataDialog、
 *   hideExportDialog、hideLayoutDialog、hideSettingsDialog、hideTemplateDialog
 * - DiagramWeave 命名空間（typeof 守衛）
 */
/* global cancelBranchSelector, cancelImportPreview, cancelMappingWizard, closeCommandPalette, hideConfirm, hideExcelDataDialog, hideExportDialog, hideLayoutDialog, hideSettingsDialog, hideTemplateDialog, showReviewPanel */
(function initDiagramWeaveAccessibility(global) {
  'use strict';

function initAccessibility() {
  document.querySelectorAll('button').forEach(button => {
    if (button.getAttribute('aria-label')) return;
    const label = button.getAttribute('title')
      || button.dataset.fcTip
      || button.dataset.i18nTitle
      || button.textContent.trim();
    if (label) button.setAttribute('aria-label', label);
  });

  document.querySelectorAll('.template-dialog, .confirm-dialog, .layout-dialog, .branch-selector, .import-preview-dialog, .mapping-wizard-dialog').forEach((dialog, index) => {
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.tabIndex = -1;
    const title = dialog.querySelector('.template-dialog-title, .confirm-title, .layout-dialog-title, .branch-selector-title, #importPreviewTitle, #mappingWizardTitle');
    if (title) {
      if (!title.id) title.id = `dw-dialog-title-${index + 1}`;
      dialog.setAttribute('aria-labelledby', title.id);
    } else if (!dialog.getAttribute('aria-label')) {
      dialog.setAttribute('aria-label', 'DiagramWeave dialog');
    }
  });

  document.querySelectorAll('.shape-item').forEach(item => {
    item.setAttribute('role', 'group');
    item.setAttribute('aria-keyshortcuts', 'Enter Space F');
    item.tabIndex = 0;
    if (!item.getAttribute('aria-label')) {
      item.setAttribute('aria-label', item.dataset.label || item.textContent.trim());
    }
  });
}

const MODAL_OVERLAY_IDS = [
  'templateOverlay', 'commandPaletteOverlay', 'importPreviewOverlay', 'mappingWizardOverlay',
  'excelDataOverlay', 'exportOverlay', 'settingsOverlay', 'confirmOverlay', 'layoutOverlay', 'branchOverlay',
];
let activeModalOverlay = null;
const modalTriggers = new WeakMap();

function modalFocusableElements(overlay) {
  return [...overlay.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.hidden && element.getClientRects().length > 0);
}

function setModalBackgroundInert(overlay, inert) {
  [...document.body.children].forEach(element => { if (element !== overlay) element.inert = inert; });
}

function activateModalContract(overlay) {
  if (activeModalOverlay === overlay) return;
  modalTriggers.set(overlay, document.activeElement);
  activeModalOverlay = overlay;
  overlay.setAttribute('aria-hidden', 'false');
  setModalBackgroundInert(overlay, true);
  const preferredFocus = {
    commandPaletteOverlay: '#commandPaletteInput',
    importPreviewOverlay: '#applyImportPreviewBtn',
    mappingWizardOverlay: '#nodeMappingFields select',
  };
  requestAnimationFrame(() => {
    const preferred = preferredFocus[overlay.id] ? overlay.querySelector(preferredFocus[overlay.id]) : null;
    (preferred || modalFocusableElements(overlay)[0])?.focus();
  });
}

function deactivateModalContract(overlay) {
  overlay.setAttribute('aria-hidden', 'true');
  if (activeModalOverlay !== overlay) return;
  setModalBackgroundInert(overlay, false);
  activeModalOverlay = null;
  const trigger = modalTriggers.get(overlay);
  if (trigger?.isConnected) requestAnimationFrame(() => trigger.focus());
}

function closeActiveModal() {
  if (!activeModalOverlay) return;
  const closeById = {
    templateOverlay: hideTemplateDialog, commandPaletteOverlay: closeCommandPalette,
    importPreviewOverlay: cancelImportPreview, mappingWizardOverlay: cancelMappingWizard,
    excelDataOverlay: hideExcelDataDialog, exportOverlay: hideExportDialog,
    settingsOverlay: hideSettingsDialog, confirmOverlay: hideConfirm,
    layoutOverlay: hideLayoutDialog, branchOverlay: cancelBranchSelector,
  };
  closeById[activeModalOverlay.id]?.();
}

function initModalContracts() {
  MODAL_OVERLAY_IDS.forEach((id, index) => {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    const dialog = overlay.querySelector('[role="dialog"], .template-dialog, .confirm-dialog, .layout-dialog, .branch-selector');
    if (dialog) {
      dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
      let title = dialog.querySelector('h1, h2, .template-dialog-title, .confirm-title, .layout-title, .layout-dialog-title, .branch-selector-title, .excel-data-title');
      if (!title) {
        title = document.createElement('span');
        title.className = 'dw-visually-hidden';
        title.textContent = dialog.getAttribute('aria-label') || 'DiagramWeave dialog';
        dialog.prepend(title);
      }
      if (!title.id) title.id = `dw-modal-title-${index + 1}`;
      dialog.setAttribute('aria-labelledby', title.id);
      dialog.removeAttribute('aria-label');
    }
    overlay.setAttribute('aria-hidden', overlay.classList.contains('visible') ? 'false' : 'true');
    new MutationObserver(() => {
      if (overlay.classList.contains('visible')) activateModalContract(overlay);
      else deactivateModalContract(overlay);
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
  });
  document.addEventListener('keydown', event => {
    if (!activeModalOverlay) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); closeActiveModal(); return;
    }
    if (event.key !== 'Tab') return;
    const focusable = modalFocusableElements(activeModalOverlay);
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, true);
}

function isMobileViewMode() {
  return window.matchMedia('(max-width: 767px)').matches;
}

function openMobileReview() {
  window.dispatchEvent(new CustomEvent('DiagramWeave:open-review'));
  showReviewPanel();
}
  global.DiagramWeaveAccessibility = {
    MODAL_OVERLAY_IDS,
    activateModalContract,
    closeActiveModal,
    deactivateModalContract,
    initAccessibility,
    initModalContracts,
    isMobileViewMode,
    modalFocusableElements,
    openMobileReview,
    setModalBackgroundInert,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

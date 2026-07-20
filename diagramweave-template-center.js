(function initTemplateCenter(global) {
  'use strict';

  const inferCategory = template => {
    const value = `${template.name || ''} ${template.nameEn || ''} ${template.type || ''}`.toLocaleLowerCase();
    if (value.includes('fishbone') || value.includes('鱼骨')) return 'Fishbone';
    if (value.includes('swimlane') || value.includes('泳道')) return 'Swimlane';
    if (value.includes('incident') || value.includes('事件')) return 'Incident';
    if (value.includes('release') || value.includes('发布')) return 'Release pipeline';
    if (value.includes('bpmn')) return 'BPMN';
    if (value.includes('approval') || value.includes('审批')) return 'Process map';
    return 'Flowchart';
  };

  function normalizeTemplate(template, index = 0) {
    const category = template.category || inferCategory(template);
    const tags = [...new Set([...(template.tags || []), category, template.type, template.layout].filter(Boolean).map(String))];
    return {
      ...template,
      id: template.id || `template-${index + 1}`,
      name: template.name || template.nameEn || `Template ${index + 1}`,
      nameEn: template.nameEn || template.name || `Template ${index + 1}`,
      description: template.description || template.descriptionEn || '',
      descriptionEn: template.descriptionEn || template.description || '',
      category,
      tags,
      preview: {
        nodeCount: template.preview?.nodeCount ?? (template.nodes || []).length,
        connectionCount: template.preview?.connectionCount ?? (template.connections || []).length,
        layout: template.preview?.layout || template.layout || template.type || 'freeform',
        ...(template.preview || {}),
      },
      sourceIndex: index,
    };
  }

  function searchTemplates(templates, query = '', category = '') {
    const needle = String(query || '').trim().toLocaleLowerCase();
    return templates.filter(template => {
      if (category && template.category !== category) return false;
      if (!needle) return true;
      return [template.name, template.nameEn, template.description, template.descriptionEn,
        template.category, ...(template.tags || [])].join(' ').toLocaleLowerCase().includes(needle);
    });
  }

  function createFavorites(storage, key = 'dw-template-favorites') {
    const read = () => { try { return [...new Set(JSON.parse(storage?.getItem(key) || '[]').map(String))]; } catch { return []; } };
    const write = values => { try { storage?.setItem(key, JSON.stringify(values)); } catch { /* unavailable */ } return values; };
    return {
      list: read,
      toggle(id) { const values = read(); return write(values.includes(id) ? values.filter(item => item !== id) : [...values, id]); },
    };
  }

  global.DiagramWeaveTemplateCenter = { normalizeTemplate, searchTemplates, createFavorites };
})(typeof window !== 'undefined' ? window : globalThis);

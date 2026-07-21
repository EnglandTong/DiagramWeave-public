(function (global) {
  function createResult(success, data, issues, warnings) {
    return {
      success: !!success,
      data: data ?? null,
      issues: Array.isArray(issues) ? issues : [],
      warnings: Array.isArray(warnings) ? warnings : [],
    };
  }

  function createSuccess(data) {
    return createResult(true, data, [], []);
  }

  function createError(issues) {
    return createResult(false, null, issues, []);
  }

  function createWarning(data, warnings) {
    return createResult(true, data, [], warnings);
  }

  function addIssue(result, issue) {
    if (result && Array.isArray(result.issues)) {
      result.issues.push(issue);
    }
    return result;
  }

  function addWarning(result, warning) {
    if (result && Array.isArray(result.warnings)) {
      result.warnings.push(warning);
    }
    return result;
  }

  global.DiagramWeaveResult = {
    createResult,
    createSuccess,
    createError,
    createWarning,
    addIssue,
    addWarning,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
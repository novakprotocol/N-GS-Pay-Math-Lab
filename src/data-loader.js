(function () {
  "use strict";

  function fail(message) {
    document.documentElement.dataset.dataStatus = "error";
    window.NGSPayDataError = message;
    throw new Error(message);
  }

  if (!window.NGSPayData) {
    fail("Calculation data did not load.");
  }

  const data = window.NGSPayData;
  const coverage = data.adjustments && data.adjustments.coverage;
  if (!coverage || coverage.first_year !== 1977 || coverage.last_year !== 2026) {
    fail("Unexpected coverage in calculation data.");
  }
  if (!data.checkpoints || !data.validation || !data.sources) {
    fail("Calculation data is incomplete.");
  }

  window.NGSPayDataReady = true;
})();

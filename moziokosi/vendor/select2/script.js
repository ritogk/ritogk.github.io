window.onload = () => {
  $("#single-select-field").select2({
    theme: "bootstrap-5",
    containerCssClass: "select2--large", // For Select2 v4.0
    selectionCssClass: "select2--large", // For Select2 v4.1
    dropdownCssClass: "select2--large",
  })
}

window.Vue.material = {
  ...window.Vue.material,

  // activeness of ripple effect
  ripple: true,

  theming: {},
  locale: {
    ...window.Vue.material.locale,

    // range for datepicker
    startYear: 1900,
    endYear: 2099,

    // date format for date picker
    dateFormat: 'yyyy-MM-dd',

    // `0` stand for Sunday, `1` stand for Monday
    firstDayOfAWeek: 1
  }
}

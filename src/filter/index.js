import moment from 'moment'
const filter = {};

const posMap = ['','','守门员']
filter.install = function(Vue) {
  Vue.filter('time', function (value) {
    if(isNaN(value)) return ''
    return moment(+value).format('YYYY/MM/DD HH:mm:ss')
  });
  Vue.filter('position', function (value) {
    return posMap[value]
  });
};

export { filter as default };

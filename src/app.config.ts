export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/record/index',
    'pages/growth/index',
    'pages/reminder/index',
    'pages/mine/index',
    'pages/feeding-edit/index',
    'pages/food-edit/index',
    'pages/diaper-edit/index',
    'pages/sleep-edit/index',
    'pages/growth-edit/index',
    'pages/reminder-edit/index',
    'pages/family/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF8BA7',
    navigationBarTitleText: '宝宝喂养记录',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF5F7'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#FF8BA7',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/record/index',
        text: '记录'
      },
      {
        pagePath: 'pages/growth/index',
        text: '成长'
      },
      {
        pagePath: 'pages/reminder/index',
        text: '提醒'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})

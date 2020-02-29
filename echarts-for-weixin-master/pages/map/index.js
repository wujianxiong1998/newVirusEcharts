import * as echarts from '../../ec-canvas/echarts';
import geoJson from './china.js';

var arrmap = []
// 确诊
var arrConfirm = []
// 疑似
var arrSusp = []
// 死亡
var arrDead = []
// 治愈
var arrHeal = []
// 时间
var arrDate = []

Page({
  onShareAppMessage: function (res) {
    return {
      title: '全国疫情分布分享wjx作！',
      path: '/pages/map/map',
      success: function () {},
      fail: function () {}
    }
  },
  data: {
    ec: {},
    newDate: '',
    desc: {},
    modify: {},
    address: {},
    hometown: {},
    newslist: []
  },

  onReady() {
    var that = this
    // 获取地图
    wx.request({
      url: 'https://api.tianapi.com/txapi/ncovcity/index?key=395c73a804a3aac86034b897584b4cf0',
      success: function (res) {
        var newslist = res.data.newslist
        newslist.forEach(item => {
          item.name = item.provinceShortName
          item.value = item.confirmedCount
        })
        arrmap = newslist
        that.barComponent = that.selectComponent('#mychart-dom-area')
        that.init_map()
        that.setData({
          newslist
        })
      }
    })
    // 获取全国疫情
    wx.request({
      url: 'https://wanshun.zmzhi.com/api/default/history',
      success: function (res) {
        var chinaTotal = res.data.getChinaTotal.data.chinaTotal
        var newDate = that.data.newDate
        newDate = chinaTotal.dataTime
        var desc = that.data.desc
        desc.nowConfirm = chinaTotal.nowConfirm
        desc.suspect = chinaTotal.suspect
        desc.dead = chinaTotal.dead
        desc.heal = chinaTotal.heal
        var chinaDayModify = res.data.getChinaTotal.data.chinaDayModify
        var modify = that.data.modify
        modify.nowConfirm = chinaDayModify.nowConfirm < 0 ? chinaDayModify.nowConfirm : '+' + chinaDayModify.nowConfirm
        modify.suspect = chinaDayModify.suspect < 0 ? chinaDayModify.suspect : '+' + chinaDayModify.suspect
        modify.dead = chinaDayModify.dead < 0 ? chinaDayModify.dead : '+' + chinaDayModify.dead
        modify.heal = chinaDayModify.heal < 0 ? chinaDayModify.heal : '+' + chinaDayModify.heal
        // 折线图数据
        var lineData = res.data.getAreaInfo_arr.chinaHistoryTotal
        arrConfirm = lineData.map(item => {
          return item.confirm
        })
        arrDead = lineData.map(item => {
          return item.dead
        })
        arrSusp = lineData.map(item => {
          return item.suspect
        })
        arrHeal = lineData.map(item => {
          return item.heal
        })
        arrDate = lineData.map(item => {
          return item.day
        })
        that.lineComponent = that.selectComponent('#mychart-dom-line')
        that.init_line()
        that.setData({
          newDate,
          desc,
          modify
        })
      }
    })
    // 获取用户地理位置
    wx.getLocation({
      success: function (res) {
        var location = res.latitude + ',' + res.longitude
        wx.request({
          url: 'https://apis.map.qq.com/ws/geocoder/v1',
          data: {
            key: 'ZNSBZ-N6I6X-5GB4M-Z4VR7-2RF5Q-2JFAJ',
            location: location
          },
          success: function (res) {
            var result = res.data.result.address_component
            var address = that.data.address
            address.city = result.city
            address.province = result.province
            that.setData({
              address
            })
            var newslist = that.data.newslist
            var hometown = that.data.hometown
            var address = that.data.address
            var provinceData = newslist.filter(item => item.provinceName === address.province)
            hometown.currentConfirmedCount = provinceData[0].currentConfirmedCount
            hometown.deadCount = provinceData[0].deadCount
            hometown.curedCount = provinceData[0].curedCount
            var cityData = provinceData[0].cities.filter(item => item.cityName+'市' === address.city)
            console.log(cityData)
            hometown.cityCurrentConfirmedCount = cityData[0].currentConfirmedCount
            hometown.cityDeadCount = cityData[0].deadCount
            hometown.cityCuredCount = cityData[0].curedCount
            that.setData({
              hometown
            })
            console.log(that.data.hometown)
          }
        })
      }
    })
  },

  init_map() {
    this.barComponent.init((canvas, width, height) => {
      // 初始化图表
      const barChart = echarts.init(canvas, null, {
        width: width,
        height: height
      });
      canvas.setChart(barChart);
      echarts.registerMap('china', geoJson);
      barChart.setOption(this.getBarOption());
      return barChart;
    })
  },
  init_line() {
    this.lineComponent.init((canvas, width, height) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height + 60
      })
      canvas.setChart(chart)
      var option = {
        color: ["#37A2DA", "#67E0E3", "#9FE6B8", "#28E"],
        legend: {
          show: true,
          data: ['确诊', '疑似', '死亡', '治愈'],
          top: 30,
          right: 50,
          z: 100,
          icon: 'circle'
        },
        grid: {
          containLabel: true
        },
        tooltip: {
          show: true,
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: arrDate,
          // show: false
        },
        yAxis: {
          x: 'center',
          type: 'value',
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          }
          // show: false
        },
        series: [{
          name: '确诊',
          type: 'line',
          smooth: true,
          data: arrConfirm
        }, {
          name: '疑似',
          type: 'line',
          smooth: true,
          data: arrSusp
        }, {
          name: '死亡',
          type: 'line',
          smooth: true,
          data: arrDead
        }, {
          name: '治愈',
          type: 'line',
          smooth: true,
          data: arrHeal
        }]
      }
      chart.setOption(option)
      return chart
    })
  },

  getBarOption() {
    return {
      tooltip: {
        trigger: 'item'
      },
      visualMap: {
        type: 'piecewise',
        left: 'left',
        top: 'bottom',
        pieces: [{
            min: 1500
          },
          {
            min: 900,
            max: 1500
          },
          {
            min: 310,
            max: 1000
          },
          {
            min: 200,
            max: 300
          },
          {
            min: 10,
            max: 200,
            label: '10 到 200（自定义label）'
          }
        ],
        color: ['#7A2F11', '#C94D22', '#EE8859', '#F3B494', '#F5DED3'],
        calculable: true
      },
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        feature: {
          dataView: {
            readOnly: false
          },
          restore: {},
          saveAsImage: {}
        }
      },
      series: [{
        type: 'map',
        mapType: 'china',
        label: {
          normal: {
            show: true
          },
          emphasis: {
            textStyle: {
              color: '#fff'
            }
          }
        },
        itemStyle: {

          normal: {
            borderColor: '#389BB7',
            areaColor: '#fff',
          },
          emphasis: {
            areaColor: '#389BB7',
            borderWidth: 0
          }
        },
        animation: false,

        data: arrmap

      }] 
    }
  }
})
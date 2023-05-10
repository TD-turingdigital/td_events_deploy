var td_config = td_config || {};

(function() {
  'use strict';
  
  // https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
  function parseCSV(strData, strDelimiter, toObj) {
    strDelimiter = strDelimiter || ',';
    var objPattern = new RegExp(
      '(\\' + strDelimiter +
        '|\\r?\\n|\\r|^)' +
        '(?:"([^"]*(?:""[^"]*)*)"|' +
        '([^"\\' +
        strDelimiter +
        '\\r\\n]*))',
      'gi'
    );
    var arrData = [[]];
    var arrMatches = null;
    while ((arrMatches = objPattern.exec(strData))) {
      var strMatchedDelimiter = arrMatches[1];
      var strMatchedValue = null;
      if (strMatchedDelimiter.length && strMatchedDelimiter != strDelimiter) {
        arrData.push([]);
      }
      if (arrMatches[2]) {
        strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
      } else {
        strMatchedValue = arrMatches[3];
      }
      arrData[arrData.length - 1].push(strMatchedValue);
    }
    if (toObj) {
      var header = arrData.shift();
      var objData = arrData.map(function (item) {
        return header.reduce(function (acc, key, index) {
          acc[key] = item[index];
          return acc;
        }, {});
      });
      return objData;
    } else {
      return arrData;
    }
  }
  
  td_config.init = function (list) {
    // 獲取所有sheet設定並整合
    Promise.all(list.map(function(url) {
      return new Promise(function(resolve, reject) {
        fetch(url)
          .then(function(res) {
            return res.text();
          })
          .then(function(data) {
            resolve(parseCSV(data, null, true));
          })
          .catch(function(error) {
            resolve([]);
          });
      });
    }))
    // 將二維陣列轉為一維陣列
    .then(function(values) {
      return values.flat();
    })
    // 篩選符合當前頁面的資料
    .then(function(dataset) {
      return dataset.filter(function(item) {
        return item.trigger === "TRUE" && window.location.href.match(new RegExp(item.target));
      });
    })
    // 根據型態部署事件
    .then(function(dataset) {
      function binding() {
        dataset.forEach(function(item) {
          var td_event_name = item.event_name;
          var td_fields = Object.keys(item).reduce(function(acc, key) {
            if(key.match(/parameter_/) && item[key]) {
              acc[key.replace(/parameter_/, '')] = item[key];
            }
            return acc;
          }, {});
          switch(item.event) {
            // 點擊事件
            case 'click': {
              document.querySelectorAll(item.selector).forEach(function(el) {
                if(!el.td_event_click_binded) {
                  el.addEventListener('click', function(e) {
                    try {
                      dataLayer.push({
                        td_event_name: null,
                        td_fields: null,
                      });
                      dataLayer.push({
                        event: 'td_event',
                        td_event_name: td_event_name,
                        td_fields: td_fields
                      });
                    } catch(e) {
                      console.log(e);
                    }
                  });
                  el.td_event_click_binded = true;
                }
              });
              break;
            }
            // 表單事件
            case 'submit': {
              document.querySelectorAll(item.selector).forEach(function(el) {
                if(!el.td_event_submit_binded) {
                  el.addEventListener('submit', function(e) {
                    try {
                      dataLayer.push({
                        td_event_name: null,
                        td_fields: null,
                      });
                      dataLayer.push({
                        event: 'td_event',
                        td_event_name: td_event_name,
                        td_fields: td_fields
                      });
                    } catch(e) {
                      console.log(e);
                    }
                  });
                  el.td_event_submit_binded = true;
                }
              });
              break;
            }
            // 元素可見度事件
            case 'visibility': {
              document.querySelectorAll(item.selector).forEach(function(el) {
                if(!el.td_event_visibility_binded) {
                  try {
                    new IntersectionObserver(function(entries) {
                      var ratio = entries[0].intersectionRatio;
                      if(0 < ratio && ratio <= 1) {
                        dataLayer.push({
                          td_event_name: null,
                          td_fields: null,
                        });
                        dataLayer.push({
                          event: 'td_event',
                          td_event_name: td_event_name,
                          td_fields: td_fields
                        });
                      }
                    }).observe(el);
                  } catch(e) {
                    console.log(e);
                  }
                  el.td_event_visibility_binded = true;
                }
              });
              break;
            }
          }
        });
      }
      binding();
      new MutationObserver(function(mutations) {
        binding();
      }).observe(document.body, { childList: true, subtree: true });
    });
  };
})();

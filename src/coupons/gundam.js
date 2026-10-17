import request from '../request.js'
import { dateFormat, removePhoneRestriction } from '../util/index.js'
import { ECODE } from './const.js'
import { actPayloads } from './payloads.js'

const GRAB_URL =
  'https://mediacps.meituan.com/gundam/gundamGrabV4?gdBs=&yodaReady=h5&csecplatform=4&csecversion=2.4.0'

const WX_UA =
  'Mozilla/5.0 (Linux; Android 14; 2201122C Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 XWEB/1160027 MMWEBSDK/20231105 MMWEBID/2247 MicroMessenger/8.0.44.2502(0x28002C37) WeChat/arm64 Weixin Android Tablet NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wxde8ac0a21135c07d'

function formatCoupons(coupons, actName) {
  function extractNumber(text) {
    const match = text.match(/满(\d+)可用/)

    return match ? parseInt(match[1], 10) : 0
  }

  return coupons.map((item) => {
    const etime =
      typeof item.etime === 'number' ? dateFormat(item.etime) : item.etime
    const amountLimit = extractNumber(item.amountLimit)

    return {
      name: item.couponName,
      etime,
      amount: item.couponAmount,
      amountLimit,
      useCondition: removePhoneRestriction(item.useCondition),
      actName: actName
    }
  })
}

async function grabCoupon(cookie, act) {
  const res = await request.post(GRAB_URL, act.payload, {
    cookie,
    headers: {
      'X-Requested-With': 'com.tencent.mm',
      'User-Agent': WX_UA,
      Origin: 'https://market.waimai.meituan.com',
      Referer: 'https://market.waimai.meituan.com/'
    }
  })

  if (res.code == 0) {
    return formatCoupons(res.data.coupons, act.name)
  }

  const apiInfo = {
    api: 'gundamGrabV4',
    name: act.name,
    msg: res.msg || res.message
  }

  if (res.code == 3) {
    throw { code: ECODE.AUTH, ...apiInfo }
  }

  throw { code: ECODE.API, ...apiInfo }
}

export default { grabCoupon, actPayloads }

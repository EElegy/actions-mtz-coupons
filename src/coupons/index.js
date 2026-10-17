import request from '../request.js'
import { createMTCookie, getUserInfo } from '../user.js'
import { ECODE } from './const.js'
import gundam from './gundam.js'

async function runTask(cookie) {
  try {
    const userInfo = await getUserInfo(cookie)

    const results = await Promise.all(
      gundam.actPayloads.map((act) =>
        gundam.grabCoupon(cookie, act).catch(() => [])
      )
    )

    return {
      code: ECODE.SUCC,
      data: {
        userInfo,
        coupons: results.flat()
      },
      msg: '成功'
    }
  } catch (e) {
    let code, msg

    switch (e.code) {
      case ECODE.AUTH:
        code = ECODE.AUTH
        msg = '登录过期'
        break
      case request.ECODE.FETCH:
        code = ECODE.API
        msg = '接口异常'
        break
      case request.ECODE.TIMEOUT:
      case request.ECODE.NETWOEK:
        code = ECODE.NETWOEK
        msg = '网络异常'
        break
      default:
        code = ECODE.RUNTIME
        msg = '程序异常'
    }

    return { code, msg, error: e }
  }
}

async function grabCoupons(token, { maxRetry = 0, proxy }) {
  if (!token) {
    return {
      code: ECODE.RUNTIME,
      msg: '请设置 token',
      error: ''
    }
  }

  if (proxy) {
    request.setProxyAgent(proxy)
  }

  const cookieJar = createMTCookie(token)

  async function main(retryTimes = 0) {
    const result = await runTask(cookieJar)
    const needRetry = [request.ECODE.NETWOEK, request.ECODE.API].includes(
      result.code
    )

    result['retryTimes'] = retryTimes

    if (!needRetry || retryTimes >= maxRetry) return result

    return main(++retryTimes)
  }

  return main()
}

export { grabCoupons, ECODE }

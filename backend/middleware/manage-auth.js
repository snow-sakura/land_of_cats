/**
 * 管理后台认证中间件
 * 检查 session 中 manageUser 是否存在，未登录重定向到登录页
 */
function manageAuth(req, res, next) {
  if (req.session && req.session.manageUser) {
    res.locals.manageUser = req.session.manageUser
    return next()
  }

  // AJAX 请求返回 401，页面请求重定向
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(401).json({ error: '未登录' })
  }

  const loginPath = `/${req.managePath}/login`
  res.redirect(loginPath)
}

module.exports = manageAuth

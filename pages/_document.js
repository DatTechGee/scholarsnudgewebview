import Document, { Html, Head, Main, NextScript } from 'next/document'

const REDIRECT_SCRIPT = `
(function(){
  var p = window.location.pathname.replace(/\\/$/, '');
  var t = localStorage.getItem('admin_token');
  var loginPage = '/school/login';
  var registerPage = '/school/register';
  var forgotPage = '/school/forgot-password';
  var resetPage = '/school/reset-password';
  var publicPages = [loginPage, registerPage, forgotPage, resetPage];

  // If on root and not logged in, redirect to login
  if (p === '/school' && !t) {
    window.location.replace(loginPage);
    return;
  }

  // If on a protected page and not logged in, redirect to login
  if (p.startsWith('/school/') && !publicPages.includes(p) && p !== '/school' && !t) {
    window.location.replace(loginPage);
    return;
  }

  // If on a public page and already logged in, redirect to dashboard
  if (publicPages.includes(p) && t) {
    var cached;
    try { cached = JSON.parse(localStorage.getItem('user_data')); } catch(e) {}
    var role = (cached && cached.role) || localStorage.getItem('user_role') || '';
    if (role === 'admin' || role === 'super_admin') { window.location.replace('/school/'); return; }
    if (role === 'lecturer') { window.location.replace('/school/lecturer'); return; }
    if (role === 'student') { window.location.replace('/school/student'); return; }
  }
})();
`

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script dangerouslySetInnerHTML={{ __html: REDIRECT_SCRIPT }} />
        </Head>
        <body>
          <Main />
          <NextScript />
          <noscript>
            <meta httpEquiv="refresh" content="0;url=/school/login" />
          </noscript>
        </body>
      </Html>
    )
  }
}

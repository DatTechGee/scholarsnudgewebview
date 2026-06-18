import Document, { Html, Head, Main, NextScript } from 'next/document'

const REDIRECT_SCRIPT = `(function(){
  var p = window.location.pathname.replace(/\\/$/, '');
  var t = localStorage.getItem('admin_token');
  var loginPage = '/school/login';
  var publicPages = ['/school/login','/school/register','/school/forgot-password','/school/reset-password'];

  if (p === '/school' && !t) { window.location.replace(loginPage); return; }

  if (p.startsWith('/school/') && !publicPages.includes(p) && p !== '/school' && !t) {
    window.location.replace(loginPage); return;
  }

  if (publicPages.includes(p) && t) {
    var role = (function(){ try { var u=JSON.parse(localStorage.getItem('user_data')); return u&&u.role; } catch(e){} })() || localStorage.getItem('user_role') || '';
    if (role==='admin'||role==='super_admin') { window.location.replace('/school/'); return; }
    if (role==='lecturer') { window.location.replace('/school/lecturer'); return; }
    if (role==='student') { window.location.replace('/school/student'); return; }
  }
})();`

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        </Head>
        <body>
          <script dangerouslySetInnerHTML={{ __html: REDIRECT_SCRIPT }} />
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

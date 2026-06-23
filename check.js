const babel = require('@babel/core')
const files = ['src/App.jsx','src/components/PlayerModal.jsx','src/pages/Consent.jsx','src/pages/Admin.jsx']
let ok = true
for (const f of files) {
  try { babel.transformFileSync(f, { presets: ['@babel/preset-react'] }); console.log('OK   '+f) }
  catch(e) { console.log('FAIL '+f+' :: '+e.message.split('\n')[0]); ok=false }
}
process.exit(ok?0:1)

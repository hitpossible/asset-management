import { useEffect, useRef, useState } from 'react'
import { LuArrowRight, LuEye, LuEyeOff, LuLockKeyhole, LuMail, LuShieldCheck, LuX } from 'react-icons/lu'
import Icon from '../components/Icon.jsx'
import './LoginPage.css'

const copy = {
  en: {
    title: 'Sign in', subtitle: 'Access TBKK Asset Management to manage assets, verifications and approvals.', identifier: 'Company email or employee ID', placeholder: 'e.g. name@tbkk.co.th or 123456', password: 'Password', passwordPlaceholder: 'Enter your password', remember: 'Remember me', forgot: 'Forgot password?', employees: 'For TBKK employees only.', help: 'Need help?', support: 'Contact IT Support', demo: 'Mockup preview · Select Sign in to explore the dashboard.', show: 'Show password', hide: 'Hide password', close: 'Close',
    dialogs: { forgot: ['Reset your password', 'Please contact your TBKK IT service desk to reset your company account password.'], support: ['IT Support', 'Contact your TBKK IT service desk through your internal support channel for help with your account or access.'] },
  },
  th: {
    title: 'เข้าสู่ระบบ', subtitle: 'เข้าสู่ TBKK Asset Management เพื่อจัดการทรัพย์สิน การตรวจสอบ และการอนุมัติ', identifier: 'อีเมลบริษัทหรือรหัสพนักงาน', placeholder: 'เช่น name@tbkk.co.th หรือ 123456', password: 'รหัสผ่าน', passwordPlaceholder: 'กรอกรหัสผ่าน', remember: 'จดจำฉัน', forgot: 'ลืมรหัสผ่าน?', employees: 'สำหรับพนักงาน TBKK เท่านั้น', help: 'ต้องการความช่วยเหลือ?', support: 'ติดต่อฝ่าย IT', demo: 'หน้าจอจำลอง · กดเข้าสู่ระบบเพื่อดู Dashboard', show: 'แสดงรหัสผ่าน', hide: 'ซ่อนรหัสผ่าน', close: 'ปิด',
    dialogs: { forgot: ['รีเซ็ตรหัสผ่าน', 'กรุณาติดต่อฝ่าย IT ของ TBKK เพื่อรีเซ็ตรหัสผ่านบัญชีบริษัทของคุณ'], support: ['ติดต่อฝ่าย IT', 'ติดต่อฝ่าย IT ของ TBKK ผ่านช่องทางภายในบริษัท เพื่อขอความช่วยเหลือเรื่องบัญชีหรือสิทธิ์การใช้งาน'] },
  },
}

export default function LoginPage({ onSignIn }) {
  const [identifier, setIdentifier] = useState(() => localStorage.getItem('tbkk-login-identifier-v1') || '')
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem('tbkk-login-identifier-v1')))
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [dialog, setDialog] = useState(null)
  const dialogRef = useRef(null)
  const t = copy.en
  useEffect(() => {
    if (dialog) dialogRef.current.showModal()
  }, [dialog])

  function signIn(event) {
    event.preventDefault()
    const id = identifier.trim()
    if (remember && id) localStorage.setItem('tbkk-login-identifier-v1', id)
    else localStorage.removeItem('tbkk-login-identifier-v1')
    onSignIn()
  }

  return (
    <main className="login-page" lang="en">
      <div className="login-layout">
        <section className="login-card" aria-labelledby="login-title">
          <h2 id="login-title">{t.title}</h2><p className="login-card-intro">{t.subtitle}</p>
          <form onSubmit={signIn} noValidate>
            <div className="login-field"><label htmlFor="login-identifier">{t.identifier}</label><div className="login-input-wrap"><LuMail size={21} /><input id="login-identifier" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={t.placeholder} /></div></div>
            <div className="login-field"><label htmlFor="login-password">{t.password}</label><div className="login-input-wrap"><LuLockKeyhole size={21} /><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passwordPlaceholder} /><button type="button" className="login-eye" aria-label={showPassword ? t.hide : t.show} aria-pressed={showPassword} onClick={() => setShowPassword((prev) => !prev)}>{showPassword ? <LuEye size={20} /> : <LuEyeOff size={20} />}</button></div></div>
            <div className="login-options"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />{t.remember}</label><button type="button" className="login-link" onClick={() => setDialog('forgot')}>{t.forgot}</button></div>
            <button className="login-submit" type="submit">{t.title}<LuArrowRight size={19} /></button>
          </form>
          <div className="login-support"><LuShieldCheck size={27} /><div><p>{t.employees}</p><p>{t.help} <button className="login-link" type="button" onClick={() => setDialog('support')}>{t.support} <Icon name="chevron" size={13} /></button></p></div></div>
          <p className="login-demo-note">{t.demo}</p>
        </section>
      </div>
      {dialog ? <dialog ref={dialogRef} className="login-dialog" onCancel={() => setDialog(null)} onClose={() => setDialog(null)}><button className="login-dialog-close" aria-label={t.close} onClick={() => setDialog(null)}><LuX size={22} /></button><h2>{t.dialogs[dialog][0]}</h2><p>{t.dialogs[dialog][1]}</p><button className="login-submit" onClick={() => setDialog(null)}>{t.close}</button></dialog> : null}
    </main>
  )
}

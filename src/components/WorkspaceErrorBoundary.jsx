import { Component } from 'react'

export default class WorkspaceErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Asset Workspace could not render', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <main className="workspace-error" role="alert">
      <section className="panel">
        <h1>ไม่สามารถแสดงหน้านี้ได้</h1>
        <p>กรุณาคัดลอกข้อความด้านล่างเพื่อแจ้งปัญหา แล้วเปิด Workspace อีกครั้ง</p>
        <pre>{this.state.error.message || String(this.state.error)}</pre>
        <button type="button" className="button button-primary" onClick={() => window.location.reload()}>เปิด Workspace อีกครั้ง</button>
      </section>
    </main>
  }
}

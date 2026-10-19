export async function readInvoiceAttachment(file) {
  const type = file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : '')
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('รองรับไฟล์ Invoice แบบ PDF, JPG, PNG และ WebP')
  if (file.size > 5 * 1024 * 1024) throw new Error('ไฟล์ Invoice ต้องมีขนาดไม่เกิน 5 MB')
  const url = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ Invoice นี้ได้ กรุณาเลือกไฟล์ใหม่'))
    reader.readAsDataURL(file.type ? file : new Blob([file], { type }))
  })
  return { id: crypto.randomUUID(), name: file.name, type, size: file.size, url }
}

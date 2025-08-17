export const getFirebaseErrorMessage = (error: any): string => {
  const code = error?.code || ''
  
  switch (code) {
    case 'auth/invalid-email':
      return 'Email không hợp lệ'
    case 'auth/user-not-found':
      return 'Tài khoản không tồn tại'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Mật khẩu không đúng'
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu (tối thiểu 6 ký tự)'
    case 'auth/email-already-in-use':
      return 'Email đã được sử dụng'
    case 'auth/too-many-requests':
      return 'Quá nhiều lần thử. Vui lòng thử lại sau'
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng'
    case 'permission-denied':
      return 'Bạn không có quyền thực hiện thao tác này'
    case 'unauthenticated':
      return 'Vui lòng đăng nhập lại'
    case 'unavailable':
      return 'Dịch vụ tạm thời không khả dụng'
    case 'deadline-exceeded':
      return 'Thao tác quá thời gian chờ'
    case 'resource-exhausted':
      return 'Tài nguyên đã hết. Vui lòng thử lại sau'
    case 'invalid-argument':
      return 'Dữ liệu không hợp lệ'
    case 'not-found':
      return 'Không tìm thấy dữ liệu'
    case 'already-exists':
      return 'Dữ liệu đã tồn tại'
    case 'aborted':
      return 'Thao tác bị hủy do xung đột'
    default:
      if (import.meta.env.DEV) {
        console.error('Firebase error:', error)
      }
      return 'Có lỗi xảy ra. Vui lòng thử lại'
  }
}
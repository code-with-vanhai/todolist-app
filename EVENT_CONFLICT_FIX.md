# Sửa lỗi xung đột sự kiện trong Calendar

## 🐛 Vấn đề đã phát hiện
Khi double-click vào một task trong calendar, **cả hai popup cùng hiển thị**:
1. Popup edit task (mong muốn)
2. Popup danh sách tasks của ngày (không mong muốn)

## 🔍 Nguyên nhân
Sự kiện `onDoubleClick` của task **bubble up** (lan truyền) đến sự kiện `onDoubleClick` của ngày chứa task đó, khiến cả hai handler được trigger.

## ✅ Giải pháp đã áp dụng

### 1. Thêm `stopPropagation()` cho sự kiện double-click của task
```typescript
onDoubleClick={(e) => {
  e.stopPropagation()  // Ngăn event bubble up
  setEditingTask(task)
}}
```

### 2. Sửa tất cả các sự kiện khác của task để tránh xung đột
- **Drag events**: `onDragStart`, `onDragEnd`
- **Touch events**: `onTouchStart`, `onTouchEnd`, `onTouchMove`  
- **Context menu**: `onContextMenu`
- **Mobile menu button**: `onClick`, `onDoubleClick`

### 3. Cải thiện "Show more indicator"
- Thêm `onClick` để mở modal danh sách tasks
- Thêm `onDoubleClick` với `stopPropagation()`
- Thêm hover effect và tooltip

## 🎯 Kết quả sau khi sửa

| Hành động | Kết quả mong đợi | Trạng thái |
|-----------|------------------|------------|
| Double-click vào ngày trống | Modal danh sách tasks | ✅ Hoạt động đúng |
| Double-click vào task | Chỉ modal edit task | ✅ Đã sửa |
| Click vào "+X more" | Modal danh sách tasks | ✅ Hoạt động đúng |
| Right-click vào task | Context menu | ✅ Hoạt động đúng |
| Drag task | Drag functionality | ✅ Hoạt động đúng |
| Long press task (mobile) | Mobile menu | ✅ Hoạt động đúng |

## 🔧 Các file đã chỉnh sửa
- `src/components/calendar/DashboardCalendar.tsx`

## 🧪 Cách test
1. Mở ứng dụng tại `http://localhost:5174/todolist-app/`
2. Vào trang Calendar
3. Thử các hành động:
   - Double-click vào ngày → Chỉ modal danh sách tasks
   - Double-click vào task → Chỉ modal edit task
   - Click "+X more" → Modal danh sách tasks
   - Right-click task → Context menu

## 💡 Bài học
Khi xử lý events trong React, cần chú ý **event bubbling** và sử dụng `stopPropagation()` khi cần thiết để tránh trigger multiple handlers không mong muốn.
export function GetFileSizeStr(size: number) {
  if (size == undefined || size <= 0) {
    return "0 B";
  }
  let sizeStr;
  if (size > 10 * 1024) {
    if (size > 1024 * 1024) {
      sizeStr = (size / (1024 * 1024)).toFixed(3) + " MB";
    } else {
      sizeStr = (size / 1024).toFixed(3) + " KB";
    }
  } else {
    sizeStr = size + " B";
  }
  return sizeStr;
}

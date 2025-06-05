export function GetSecondFromDuration(duration: number): number {
  if (!duration) {
    return 0;
  }
  return Math.floor(duration / 1000000000);
}

export function GetTimeStringBySeconds(seconds: number): string {
  if (seconds <= 0) {
    return "0秒";
  }

  let timeString = "";

  const hours = Math.floor(seconds / 3600);
  if (hours > 0) {
    timeString += `${hours}小时`;
  }

  const minutes = Math.floor((seconds % 3600) / 60);
  if (minutes > 0 || hours > 0) {
    if (hours > 0 && minutes < 10) {
      timeString += "0";
    }
    timeString += `${minutes}分钟`;
  }

  seconds = seconds % 60;
  if (seconds > 0 || minutes > 0 || hours > 0) {
    if ((hours > 0 || minutes > 0) && seconds < 10) {
      timeString += "0";
    }
    timeString += `${seconds.toFixed(0)}秒`;
  }

  return timeString;
}

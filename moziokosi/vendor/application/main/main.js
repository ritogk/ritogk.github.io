import { Transcode } from "./transcode.js"
import { Transcription } from "./transcription.js"

// グローバル変数はここで渡す。
var ffmpeg = FFmpeg
var module = Module
// wasmのインスタス？
var instance = null

export const startMain = async () => {
  const onProgressTranscode = (p) => {
    document.getElementById("ffmpegProgress").value = p.ratio
  }

  document.getElementById("transcodeArea").style.display = "none"
  const completeTranscode = () => {
    document.getElementById("transcodeArea").style.display = ""
  }

  const transcode = new Transcode(
    ffmpeg,
    onProgressTranscode,
    completeTranscode
  )

  const transcription = new Transcription(module, instance)
  const btnModelDlElement = document.getElementById("btnModelDl")
  btnModelDlElement.addEventListener("click", transcription.loadModel)

  const btnTranscribeElement = document.getElementById("btnTranscribe")
  btnTranscribeElement.addEventListener("click", async (e) => {
    // 変換したオーディオファイルのblobUrl
    const audioBlobUrl = transcode.getTranscodedBlobUrl()
    await transcription.setAudio(audioBlobUrl)

    const intervalID = setInterval(() => {
      document.getElementById("progressTranscribe").value =
        document.getElementById("progressTranscribe").value + 0.0001
    }, 300)

    const onProgressTranscription = (ratio, log) => {
      document.getElementById("progressTranscribe").value = ratio
      document.getElementById("logTranscription").value =
        document.getElementById("logTranscription").value + "\n" + log
      if (ratio >= 1) {
        clearInterval(intervalID)
        alert("文字起こし完了")
      }
    }
    transcription.transcribe(onProgressTranscription)
  })

  const btnDownloadElement = document.getElementById("btnDownload")
  btnDownloadElement.addEventListener("click", () => {
    transcription.download()
  })
}

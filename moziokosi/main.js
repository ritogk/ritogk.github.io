import { Transcode } from "./transcode.js"
import { Transcription } from "./transcription.js"

// グローバル変数はここで渡す。
var ffmpeg = FFmpeg
var module = Module
// wasmのインスタス？
var instance = null

window.onload = async () => {
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

    const onProgressTranscription = (ratio) => {
      document.getElementById("progressTranscribe").value = ratio
    }
    transcription.transcribe(onProgressTranscription)
  })
}

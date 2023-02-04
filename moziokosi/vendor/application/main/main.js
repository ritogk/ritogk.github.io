import { Transcode } from "./transcode.js"
import { Transcription } from "./transcription.js"

// グローバル変数はここで渡す。
var ffmpeg = FFmpeg
var module = Module
// wasmのインスタス？
var instance = null

export const startMain = async () => {
  // 制御フラグ
  let completedLoadModel = false
  let completedTranscode = false
  let completedTranscribe = false

  // ボタンを非活性にする
  const btnTranscribeAreaElement =
    document.getElementById("btnTranscribe").parentElement
  btnTranscribeAreaElement.classList.add("disabled")
  const btnDownloadAreaElement =
    document.getElementById("btnDownload").parentElement
  btnDownloadAreaElement.classList.add("disabled")

  // メディアファイル変換モジュール
  const transcription = new Transcription(module, instance)

  // 【AIモード】
  // モデルロード時のプログレスバー
  const progressLoadModel = document.getElementById("progress-load-model")
  const onProgressLoadModel = function (ratio) {
    progressLoadModel.style.display = "block"
    progressLoadModel.children[0].style.width = Math.round(100 * ratio) + "%"
  }
  // モデールロード後のコールバック関数
  const completeFunc = () => {
    progressLoadModel.style.display = "none"
    completedLoadModel = true
    if (completedLoadModel && completedTranscode) {
      btnTranscribeAreaElement.classList.remove("disabled")
    }
  }

  // 初期モデル
  transcription.loadModel("base", onProgressLoadModel, completeFunc)
  // 「高速」ボタン
  const radioHighSpeed = document.getElementById("radioHighSpeed")
  radioHighSpeed.addEventListener("click", () => {
    transcription.loadModel("base", onProgressLoadModel, completeFunc)
  })
  // 「高精度」ボタン
  const radioHighAccuracy = document.getElementById("radioHighAccuracy")
  radioHighAccuracy.addEventListener("click", () => {
    transcription.loadModel("small", onProgressLoadModel, completeFunc)
  })

  // 【メディアファイル変換】
  const completeTranscode = () => {
    completedTranscode = true
    if (completedLoadModel && completedTranscode) {
      btnTranscribeAreaElement.classList.remove("disabled")
    }
    console.log("完了")
  }
  // メディアファイル変換用のプログレスバー
  const progressTranscodeElement = document.getElementById("progress-transcode")
  const onProgressTranscode = function (p) {
    if (p.ratio >= 1) {
      progressTranscodeElement.style.display = "none"
    } else {
      progressTranscodeElement.style.display = "block"
    }
    progressTranscodeElement.children[0].style.width =
      Math.round(100 * p.ratio) + "%"
  }

  // 文字起こしモジュール
  const transcode = new Transcode(
    ffmpeg,
    onProgressTranscode,
    completeTranscode
  )

  // 【文字起こし】
  const btnTranscribeElement = document.getElementById("btnTranscribe")
  btnTranscribeElement.addEventListener("click", async (e) => {
    // 変換したオーディオファイルのblobUrl
    const audioBlobUrl = transcode.getTranscodedBlobUrl()
    await transcription.setAudio(audioBlobUrl)

    const progressTranscriptionElement = document.getElementById(
      "progressTranscription"
    )

    const intervalID = setInterval(() => {
      progressTranscriptionElement.children[0].style.width =
        Number(
          progressTranscriptionElement.children[0].style.width.replace("%", "")
        ) +
        0.01 +
        "%"
    }, 300)

    const onProgressTranscription = (ratio, log) => {
      progressTranscriptionElement.children[0].style.width =
        Math.round(100 * ratio) + "%"

      document.getElementById("logTranscription").innerText =
        document.getElementById("logTranscription").innerText + "\n" + log
      if (ratio >= 1) {
        clearInterval(intervalID)
        progressTranscriptionElement.style.display = "none"
        completedTranscribe = true
        btnDownloadAreaElement.classList.remove("disabled")
        alert("文字起こしが完了しました。")
      }
    }

    progressTranscriptionElement.style.display = "block"
    transcription.transcribe(
      onProgressTranscription,
      document.getElementById("language").value
    )
  })

  //【文字起こし済ファイルのダウンロード】
  const btnDownloadElement = document.getElementById("btnDownload")
  btnDownloadElement.addEventListener("click", () => {
    transcription.download()
  })
}

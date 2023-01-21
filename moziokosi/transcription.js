export class Transcription {
  #kMaxAudioS = 1800
  #kSampleRate = 16000
  #audio = null
  #audio_duration = 0
  #module = null
  #instance = null
  #transcription = []
  constructor(module) {
    this.#module = module
  }
  loadModel = () => {
    const model = "small"
    let urls = {
      small: "./vendor/whisper/models/ggml-small.bin",
    }

    let sizes = {
      "tiny.en": 75,
      tiny: 75,
      "base.en": 142,
      base: 142,
      "small.en": 466,
      small: 466,
    }

    let url = urls[model]
    let dst = "whisper.bin"
    let size_mb = sizes[model]

    loadRemote(url, dst, size_mb, null, null, null, null)
  }

  setAudio = async (audioBlobUrl) => {
    const audioContext = new AudioContext({
      sampleRate: this.#kSampleRate,
      channelCount: 1,
      echoCancellation: false,
      autoGainControl: true,
      noiseSuppression: true,
    })
    return new Promise(async (resolve) => {
      audioContext.decodeAudioData(
        await (await (await fetch(audioBlobUrl)).blob()).arrayBuffer(),
        (audioBuffer) => {
          this.#audio = audioBuffer.getChannelData(0)
          this.#audio_duration = audioBuffer.duration
          resolve()
        }
      )
    })
  }

  transcribe = async (callbackFuncOnProgress) => {
    const translate = false
    if (!this.#instance) {
      this.#instance = this.#module.init("whisper.bin")

      if (this.#instance) {
        console.log("js: whisper initialized, instance: " + this.#instance)
        // document.getElementById("model").innerHTML =
        //   "Model loaded: " + model_whisper
      }
    }

    if (!this.#instance) {
      console.log("js: failed to initialize whisper")
      return
    }
    if (!this.#audio) {
      console.log("js: no audio data")
      return
    }

    if (this.#instance) {
      console.log("")
      console.log("js: processing - this might take a while ...")
      console.log("")

      setTimeout(() => {
        var ret = this.#module.full_default(
          this.#instance,
          this.#audio,
          document.getElementById("language").value,
          translate
        )
        console.log("js: full_default returned: " + ret)
        if (ret) {
          console.log("js: whisper returned: " + ret)
        }
      }, 100)
    }

    // whipserのprogressコールバックがなさそうなので、ログ出力関数を書き換えて無理やりそれっぽく作った
    // [00:00:27.000 --> 00:00:29.000]  よろしくお願いします
    out = (str) => {
      if (
        str.indexOf("-->") != -1 &&
        str.indexOf("[") != -1 &&
        str.indexOf("]") != -1
      ) {
        const proc_time = str.substr(18, 12).split(":")
        const proc_seconds =
          Number(proc_time[0]) * 3600 +
          Number(proc_time[1]) * 60 +
          Number(proc_time[2])
        const ratio = proc_seconds / this.#audio_duration
        debugger
        this.#transcription.push({
          time: str.substr(0, 31),
          speach: str.substr(33, str.length - 33),
        })

        callbackFuncOnProgress(ratio)
      }
      console.log(str)
    }
  }

  getTranscription = () => {
    return this.#transcription
  }
}

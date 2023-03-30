;(function () {
  function triangular(n) {
    if (n <= 1) return n
    return n + triangular(n - 1)
  }
  echarts.registerMap('France', { geoJSON })

  const chart = echarts.init(document.querySelector('main'))
  chart.setOption({ geo: { top: 0, left: 0, bottom: 0, right: 0, map: 'France' } })

  function onCsv() {
    const [header, ...lines] = this.result.trim().split(/\r?\n/)
    const [, , ...headers] = header.split(';')

    const variants = []
    for (const line of lines) {
      const [, , ...values] = line.split(';')
      for (let i = 0; i < values.length; i++) {
        variants[i] = variants[i] || {}
        variants[i].min = !variants[i].min ? values[i] : Math.min(variants[i].min, values[i])
        variants[i].max = !variants[i].max ? values[i] : Math.max(variants[i].max, values[i])
      }
    }

    const t = triangular(headers.length)

    const details = {}
    const serie = { top: 0, left: 0, bottom: 0, right: 0, name: 'Qualité', type: 'map', map: 'France', data: [] }

    for (const line of lines) {
      const [code, name, ...values] = line.split(';')
      let total = 0
      const lines = []
      for (let i = 0; i < values.length; i++) {
        const weight = values.length - i
        const quality = (values[i] - variants[i].min) / (variants[i].max - variants[i].min)
        total += (quality * weight) / t
        lines.push(`<li>${headers[i]}: ${values[i]} (${Math.round(quality * 100)}%)</li>`)
      }
      details[name] = `<div><b>${code} - ${name}</b><ul>${lines.join('')}</ul></div>`
      serie.data.push({ name, value: total })
    }

    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: ({ name }) => details[name],
      },
      visualMap: {
        min: 0,
        max: 1,
        inRange: {
          color: ['red', 'yellow', 'green'],
        },
        text: ['Qualité élevée', 'Basse qualité'],
        calculable: true,
      },
      series: [serie],
    })
  }

  document.querySelector('input').addEventListener('change', (e) => {
    const reader = new FileReader()
    reader.onload = onCsv
    reader.readAsText(e.target.files[0])
  })
})()

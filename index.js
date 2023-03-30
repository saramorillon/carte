;(function () {
  function triangular(n) {
    if (n <= 1) return n
    return n + triangular(n - 1)
  }

  function parseCsv(csv) {
    const departments = []

    const [header, weight, ideal, ...lines] = csv.trim().split(/\r?\n/)
    const [, , ...headers] = header.split(';')
    const [, , ...weights] = weight.split(';')
    const [, , ...ideals] = ideal.split(';')

    for (let i = 0; i < lines.length; i++) {
      const [code, name, ...values] = lines[i].split(';')

      departments[i] = departments[i] || { code, name, quality: 0, indicators: [] }

      for (let j = 0; j < values.length; j++) {
        departments[i].indicators[j] = {
          name: headers[j],
          weight: Number(weights[j]),
          value: Number(values[j]),
          ideal: Number(ideals[j]),
          gap: Math.abs(Number(ideals[j]) - Number(values[j])),
        }
      }
    }

    const variants = new Array(headers.length).fill(0).map(() => ({}))

    for (const department of departments) {
      for (let i = 0; i < department.indicators.length; i++) {
        const indicator = department.indicators[i]
        const variant = variants[i]
        variant.min = !variant.min ? indicator.gap : Math.min(variant.min, indicator.gap)
        variant.max = !variant.max ? indicator.gap : Math.max(variant.max, indicator.gap)
      }
    }

    for (const department of departments) {
      for (let i = 0; i < department.indicators.length; i++) {
        const indicator = department.indicators[i]
        const variant = variants[i]
        indicator.quality = 1 - (indicator.gap - variant.min) / (variant.max - variant.min)
        department.quality += indicator.quality * (indicator.weight / 100)
      }
    }

    return departments
  }

  function onCsv() {
    const departments = parseCsv(this.result)

    const details = {}
    const serie = { top: 0, left: 0, bottom: 0, right: 0, name: 'Qualité', type: 'map', map: 'France', data: [] }

    let min
    let max

    for (const department of departments) {
      const value = department.quality * 100
      min = min ? Math.min(min, value) : value
      max = max ? Math.max(max, value) : value
      serie.data.push({ name: department.name, value })
      const lines = department.indicators
        .sort((i1, i2) => i2.weight - i1.weight)
        .map((indicator) => `<li>${indicator.name}: ${indicator.value} (${Math.round(indicator.quality * 100)}%)</li>`)
      details[department.name] = `<div><b>${department.code} - ${department.name}: ${Math.round(
        value
      )}%</b><ul>${lines.join('')}</ul></div>`
    }

    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: ({ name }) => details[name],
      },
      visualMap: {
        min,
        max,
        inRange: {
          color: ['red', 'yellow', 'green'],
        },
        text: ['Qualité élevée', 'Basse qualité'],
      },
      series: [serie],
    })
  }

  echarts.registerMap('France', { geoJSON })

  const chart = echarts.init(document.querySelector('main'))
  chart.setOption({ geo: { top: 0, left: 0, bottom: 0, right: 0, map: 'France' } })

  document.querySelector('input').addEventListener('change', (e) => {
    const reader = new FileReader()
    reader.onload = onCsv
    reader.readAsText(e.target.files[0])
  })
})()

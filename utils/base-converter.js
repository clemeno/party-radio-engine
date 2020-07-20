'use strict'

const SYMBOLS = '0123456789abcdefghijklmnopqrstuvwxyz:;<=?@$ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹ>ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const SYMBOLS_LENGTH = SYMBOLS.length

/**
 * base convert big base small numbers
 */
const baseConvertBBSN = (n, from, to) => {
  const N = `${n}`

  if ((+from <= 0) || (SYMBOLS_LENGTH < +from)) {
    console.log(`Base from ${from} not in 1..${SYMBOLS_LENGTH}`)
    return null
  }

  if ((+to <= 0) || (SYMBOLS_LENGTH < +to)) {
    console.log(`Base to ${to} not in 1..${SYMBOLS_LENGTH}`)
    return null
  }

  let nBaseTen = 0
  if (+from === 10) {
    nBaseTen = parseInt(N)
  } else {
    const sizeN = N.length
    for (let i = 0; i < sizeN; i += 1) {
      const Ni = N[i]

      let mul = 0
      let bMulOk = false
      while (mul < SYMBOLS_LENGTH) {
        bMulOk = Ni === SYMBOLS[mul]
        if (bMulOk) {
          break
        } else {
          mul += 1
        }
      }

      if (from <= mul) {
        console.log(`Symbol not allowed in base ${from}`)
        return null
      }

      if (bMulOk) {
        console.log('Symbol not found')
        return null
      }

      const exp = sizeN - i - 1
      nBaseTen += mul * (!exp ? 1 : Math.pow(from, exp))
    }
  }

  if (to !== 10) {
    const nTo = []
    while (nBaseTen > 0) {
      const mod = nBaseTen % to
      if ((mod < 0) || (SYMBOLS_LENGTH <= mod)) {
        console.log(`Out of bounds mod ${mod} not in 0..${SYMBOLS_LENGTH}`)
        return null
      }
      nTo.push(SYMBOLS[mod])
      nBaseTen = parseInt(nBaseTen / to)
    }
    return nTo.reverse().toString().replace(/,/g, '')
  }

  return nBaseTen.toString()
}

/**
 * from pure numeric string in base [2,36] to base [2,36] else throws
 * @param _: { from: string | number, base: number, toBase: number }
 */
const rebase = _ => {
  const { from, base, toBase } = _

  const range = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
  const fromRange = range.slice(0, base)
  const toRange = range.slice(0, toBase)

  let decValue = `${from}`.split('').reverse().reduce(
    (carry, digit, index) => {
      const indexOfDigit = fromRange.indexOf(digit)
      if (indexOfDigit === -1) {
        throw new Error(`Invalid digit '${digit}' in '${from}' for base ${base}`)
      }
      carry += indexOfDigit * (Math.pow(base, index))
      return carry
    },
    0
  )

  let newValue = ''
  while (decValue > 0) {
    newValue = toRange[decValue % toBase] + newValue
    decValue = (decValue - (decValue % toBase)) / toBase
  }
  return newValue || '0'
}

const fromBase10To16 = _ => rebase({ from: _, base: 10, toBase: 16 })
const fromBase16To10 = _ => rebase({ from: _, base: 16, toBase: 10 })

module.exports = { SYMBOLS, SYMBOLS_LENGTH, baseConvertBBSN, rebase, fromBase10To16, fromBase16To10 }

import { unpromisify } from '../util/promise'
import { EventSourceDef } from '../structs/event-source-def'
import { EventSourceError } from '../structs/event-source'
import { EventInput } from '../structs/event-parse'
import { createPlugin } from '../plugin-system'

export type EventSourceFunc = (
  arg: {
    start: Date
    end: Date
    startStr: string
    endStr: string
    timeZone: string
  },
  successCallback: (events: EventInput[]) => void,
  failureCallback: (error: EventSourceError) => void
) => (void | PromiseLike<EventInput[]>)


let eventSourceDef: EventSourceDef = {

  parseMeta(raw: any): EventSourceFunc {
    if (typeof raw === 'function') { // short form
      return raw
    } else if (typeof raw.events === 'function') {
      return raw.events
    }
    return null
  },

  fetch(arg, success, failure) {
    let dateEnv = arg.context.dateEnv
    let func = arg.eventSource.meta as EventSourceFunc

    unpromisify(
      func.bind(null, { // the function returned from parseMeta
        start: dateEnv.toDate(arg.range.start),
        end: dateEnv.toDate(arg.range.end),
        startStr: dateEnv.formatIso(arg.range.start),
        endStr: dateEnv.formatIso(arg.range.end),
        timeZone: dateEnv.timeZone
      }),
      function(rawEvents) { // success
        success({ rawEvents }) // needs an object response
      },
      failure // send errorObj directly to failure callback
    )
  }

}

export const funcEventSourcePlugin = createPlugin({
  eventSourceDefs: [ eventSourceDef ]
})

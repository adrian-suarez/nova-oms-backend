

export class EventConfig {

  readonly eventBusName:string;

  constructor() {
    // Events
    this.eventBusName = process.env.AWS_EVENT_BUS_NAME!;

  }
}

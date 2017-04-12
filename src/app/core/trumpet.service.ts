import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PianoService } from './piano.service';

@Injectable()
export class TrumpetService {
  keys = [];
  valves = ['j', 'k', 'l'];
  tolerance = 200;
  timeout;
  started = Date.now();
  guessed;
  reactions = [];
  again;
  insecurity = 0;
  maxInsecurity = 3;
  current = 0;
  combo = 1;
  tries = 0;
  score = 0;
  message: string;
  averageReaction;
  color;
  valveMap = { //TODO add higher keys
    0: [40, 47, 52, 56],
    2: [39, 46, 51, 55, 58],
    1: [38, 45, 50, 54, 57],
    3: [37, 44, 49, 53],
    6: [36, 43, 48],
    5: [35, 42],
    7: [34, 41]
  };

  // Observable sources
  private valveSource = new Subject();

  // Observable streams
  valvesPressed$ = this.valveSource.asObservable();

  constructor(private pianoService: PianoService) {
  }

  getKeys(combo) {
    return this.valveMap[combo];
  }

  /*getNotes() {
   return Object.keys(this.valveMap).reduce((notes, keys) => {
   return notes.map(index => {
   return this.pianoService.pianoKeyMap[index];
   });
   });
   }*/

  changedCombo(timeout?) {
    this.current = this.keys.reduce((sum, key) => {
      return sum + Math.pow(2, this.valves.indexOf(key));
    }, 0);
    if (this.timeout) {
      this.insecurity++;
      clearTimeout(this.timeout);
    }
    this.guessed = Date.now();
    const time = (this.guessed - this.started);
    this.timeout = setTimeout(() => {
      if (time !== 0) {
        console.log('time', time);
        this.reactions.push(time);
      }
      this.valveSource.next(this.current);
    }, timeout || this.tolerance);
  }

  keyPress(event) {
    if (this.valves.indexOf(event.key) === -1) {
      this.changedCombo();
      return false;
    }
    if (event.type === 'keydown' && this.keys.indexOf(event.key) === -1) {
      this.keys.push(event.key);
      this.changedCombo();
    }
    if (event.type === 'keyup' && this.keys.indexOf(event.key) !== -1) {
      this.keys.splice(this.keys.indexOf(event.key), 1);
      this.changedCombo();
    }
  }
}

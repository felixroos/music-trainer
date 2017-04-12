import { AfterViewChecked, Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { NotationService } from './notation.service';
import { PianoService } from '../core/piano.service';
import { QuizService } from '../core/quiz.service';
import { PianoNote } from '../core/piano-note';
import { PianoMode } from '../core/piano-mode.enum';
import { QuizResult } from '../core/quiz-result';
const $ = require("jquery");
// import $ from "jquery";

@Component({
  selector: 'notation',
  templateUrl: './notation.component.html',
  styleUrls: ['./notation.component.css']
})
export class NotationComponent implements OnInit, AfterViewChecked {
  @Input() mode: PianoMode;
  subscription: Subscription;
  notationAsSVG: any;
  noteColor: string[];

  constructor(private pianoService: PianoService, private notationService: NotationService, private quizService: QuizService) {
    this.subscription = pianoService.notePlayed$.subscribe(note => this.handleNotePlayed(note));
    quizService.quizResult$.subscribe(result => this.handleQuizResult(result));

    // quizService.sheetLoader$.subscribe(sheet => this.renderSheet(sheet));
  }

  ngOnInit() {
    // Render the (empty) piano score (will contain hidden notes to ensure staff spans full width)
    this.notationAsSVG = this.notationService.renderNotation();
    this.noteColor = [];
  }

  ngAfterViewChecked() {
    let self = this;
    $("g.note").off().on('click', function () {
      self.noteClicked(this.id);
    });

    for (let i = 0; i < this.noteColor.length; i++) {
      if (this.noteColor[i]) {
        $("#" + i).attr("fill", this.noteColor[i])
      }
    }
  }

  handleNotePlayed(note: PianoNote) {
    if (this.mode === PianoMode.Play) {
      console.log('!add note...');
      this.notationService.addNote(note);
      this.notationAsSVG = this.notationService.renderNotation();
    }
  }

  handleQuizResult(result: QuizResult) {
    let color = "";
    if (result.selectedKeyId == result.actualNote.keyId) {
      // Correct
      color = "#4CAF50"; // Green
    }
    else {
      // Incorrect
      color = "#f44336"; // Ref
    }
    this.noteColor.push(color);
  }

  noteClicked(id: number) {
    this.pianoService.playNote(this.notationService.notes[id].noteId);
  }

  clear() {
    this.noteColor.length = 0;
    this.notationService.clear();
    this.notationAsSVG = this.notationService.renderNotation();
  }

  useKeySignature(keySignature?) {
    this.notationService.keySignature = keySignature;
  }

  getKeySignature() {
    return this.notationService.keySignature;
  }

  addNote(note: PianoNote) {
    console.log('add note', note);
    this.notationService.addNote(note);
    this.notationAsSVG = this.notationService.renderNotation();
  }

  addNotes(notes: Array<PianoNote>) {
    notes.forEach((note) => {
      this.notationService.addNote(note);
    });
    this.notationAsSVG = this.notationService.renderNotation();
  }
}

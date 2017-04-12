import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { PianoNote } from './piano-note';
import { QuizResult } from './quiz-result';
import { QuizStatus } from './quiz-status.enum';
import { Sheet } from './sheet';
import { PianoService } from './piano.service';

@Injectable()
export class QuizService {

  private quizLength = 16;
  private quizNotes: string[] = [];
  private quizResults: QuizResult[] = [];
  private quizIndex = 0;

  inProgress: boolean = false;
  correct: number = 0;
  incorrect: number = 0;
  status: QuizStatus = QuizStatus.None;
  level;

  // Observable sources
  private quizResultSource = new Subject<QuizResult>();
  private sheetSource = new Subject<Sheet>();

  // Observable streams
  quizResult$ = this.quizResultSource.asObservable();
  sheetLoader$ = this.sheetSource.asObservable();

  constructor(private pianoService: PianoService) {
  }

  startQuiz(quizLength: number, level: string, loop?: boolean) {
    // this.notation.clear();
    this.level = level;
    console.log('start quiz!!!');
    let notes: string[] = [];
    if (level === 'easy') {
      notes = this.pianoService.getAllNaturalNoteIds(3, 4); // middle 2 octaves only!
    } else if (level === 'medium') {
      notes = this.pianoService.getAllNaturalNoteIds();
    } else if (level === 'Special') {
      // notes = this.pianoService.getNaturalNotes(34, 58);
      notes = this.pianoService.getNaturalNotes(34, 58, false);
    } else {
      // hard level
      notes = this.pianoService.getAllNoteIds();
    }

    this.quizLength = quizLength;
    // clear quiz data
    this.quizNotes.length = 0;
    this.quizResults.length = 0;

    this.quizIndex = 0;
    if (!loop) {
      this.correct = 0;
      this.incorrect = 0;
    }

    this.inProgress = true;
    var indices = [];
    // generate random notes from the availableNotes array
    for (let i = 0; i < this.quizLength; i++) {
      indices.push(Math.floor(Math.random() * notes.length));
    }
    // indices.sort((a, b) => a - b);
    this.quizNotes = indices.map((index) => {
      return notes[index];
    });
  }

  getNotes() {
    return this.quizNotes;
  }

  getCurrentNoteId() {
    return this.quizNotes[this.quizIndex];
  }

  next(): boolean {

    // check if quiz has finished
    if (this.quizIndex == (this.quizLength - 1)) {
      this.inProgress = false;
      return false;
    }

    // otherwise move on to next quiz note.
    this.quizIndex++;
    return true;
  }

  recordValves(keys, actualNote: PianoNote) {
    // update score
    console.log('keys', keys, actualNote.keyId);
    const index = keys.indexOf(actualNote.keyId);
    if (keys.indexOf(actualNote.keyId) !== -1) {
      console.log('correct!!!');
      this.correct++;
    } else {
      console.log('not correct.........');
      this.incorrect++;
    }
    let result = new QuizResult();
    result.selectedKeyId = keys[index];
    result.actualNote = actualNote;
    result.quizNumber = this.quizIndex + 1;

    this.quizResults.push(result);
    this.quizResultSource.next(result);
  }

  recordResult(selectedKeyId: number, actualNote: PianoNote) {
    // update score
    if (selectedKeyId === actualNote.keyId) {
      this.correct++;
    } else {
      this.incorrect++;
    }

    let result = new QuizResult();
    result.selectedKeyId = selectedKeyId;
    result.actualNote = actualNote;
    result.quizNumber = this.quizIndex + 1;

    this.quizResults.push(result);
    this.quizResultSource.next(result);
  }

}

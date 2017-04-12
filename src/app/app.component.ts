import { Component, HostListener, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { NotationComponent } from './notation/notation.component';

import { PianoService } from './core/piano.service';
import { SoundService } from './core/sound.service';
import { QuizService } from './core/quiz.service';
import { PianoNote } from './core/piano-note';
import { PianoMode } from './core/piano-mode.enum';
import { QuizStatus } from './core/quiz-status.enum';
import { TrumpetService } from './core/trumpet.service';
import { NotationService } from './notation/notation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  PianoMode = PianoMode; // allows template access to PianoMode enum
  title: string = 'Piano Play';
  mode: PianoMode = PianoMode.Play;
  subscription: Subscription;

  quizCorrect: number = 0;
  quizIncorrect: number = 0;
  quizLength: number = 16;
  quizStatus: QuizStatus = QuizStatus.None;
  resultDescription: string = "";
  trumpet: Subscription;

  private currentTestNote: PianoNote;
  private timeoutId: any;
  private delayMs = 1000;

  @ViewChild(NotationComponent) notation: NotationComponent;

  constructor(private pianoService: PianoService, private trumpetService: TrumpetService,
    private soundService: SoundService,
    private quizService: QuizService, private notationService: NotationService) {
    this.subscription = pianoService.notePlayed$.subscribe(note => this.handleNotePlayed(note));
    this.trumpet = trumpetService.valvesPressed$.subscribe(valves => this.handleValves(valves));

  }

  ngOnInit() {
    this.soundService.initialize();
  }

  handleModeSelected(selectedMode: PianoMode) {
    if (this.mode == selectedMode) {
      return;
    }

    // Mode has been changed
    this.mode = selectedMode;
    if (this.mode == PianoMode.Quiz) {
      this.newQuiz();
    }
    else {
      // Clear all notes from the notation component
      this.notation.clear();
    }
  }

  handleValves(valves) {
    if (this.mode !== PianoMode.Play && this.quizService.inProgress) {
      this.quizService.recordValves(this.trumpetService.getKeys(valves), this.currentTestNote);
      this.processQuizResult();
    }

  }

  handleKeyPlayed(keyId: number) {
    if (this.mode === PianoMode.Play) {
      this.pianoService.playNoteByKeyId(keyId);
    } else {
      // We are in Quiz mode, so just play the note sound
      this.soundService.playNote(keyId);

      // Update the quiz in progress
      if (this.quizService.inProgress) {

        this.quizService.recordResult(keyId, this.currentTestNote);
        this.processQuizResult();
      }
    }
  }

  processQuizResult() {
    this.quizCorrect = this.quizService.correct;
    this.quizIncorrect = this.quizService.incorrect;

    if (this.quizService.next()) {
      this.currentTestNote = this.pianoService.getNote(this.quizService.getCurrentNoteId(), this.notation.getKeySignature());
      console.log('next quiz note', this.currentTestNote);
      console.log('level', this.quizService.level);
      if (this.quizService.level !== 'Special') {
        this.notation.addNote(this.currentTestNote);
      }
    } else {
      setTimeout(() => this.finishQuiz(), this.delayMs);
    }
  }

  handleNotePlayed(note: PianoNote) {
    this.soundService.playNote(note.keyId);
  }

  handleButtonClicked(data: any) {
    if (data.button == 'start') {
      this.startQuiz(data.level, data.signature);
    }
    else if (data.button = 'try-again') {
      this.newQuiz();
    }
  }

  private newQuiz() {
    this.notation.clear();
    this.quizStatus = QuizStatus.Starting;
  }

  private startQuiz(level: string, signature?: string, loop?: boolean) {
    this.quizService.startQuiz(this.quizLength, level, loop);
    this.quizStatus = QuizStatus.InProgress;
    this.quizCorrect = this.quizService.correct;
    this.quizIncorrect = this.quizService.incorrect;
    if (level !== 'Special') {
      this.notation.addNote(this.currentTestNote);
    } else {
      const maxAccidentals = 3;
      const signs = ['f', 's'];
      // signature = "6f";
      signature = signature || Math.round(Math.random() * maxAccidentals) + signs[Math.round(Math.random())];
      this.notation.useKeySignature(signature);
      this.notation.addNotes(this.quizService.getNotes().map((note) => {
        return this.pianoService.getNote(note);
      }));
    }
    this.currentTestNote = this.pianoService.getNote(this.quizService.getCurrentNoteId(), this.notation.getKeySignature());
  }

  private finishQuiz() {
    if (this.quizCorrect == this.quizLength) {
      this.resultDescription = "Perfect score, awesome!";
    }
    else if (this.quizCorrect > (this.quizLength * 0.8)) {
      this.resultDescription = "Great score, well done!";
    }
    else if (this.quizCorrect > (this.quizLength * 0.6)) {
      this.resultDescription = "Good score!";
    }
    else if (this.quizCorrect > (this.quizLength * 0.4)) {
      this.resultDescription = "Not bad, keep trying.";
    }
    else {
      this.resultDescription = "Looks like you need more practice.";
    }

    this.quizStatus = QuizStatus.Finished;

    this.notation.clear();
    this.quizStatus = QuizStatus.Starting;
    this.startQuiz('Special', this.notationService.keySignature, true);
  }

  @HostListener('document:keydown', ['$event'])
  @HostListener('document:keyup', ['$event'])
  keyboardInput(event) {
    this.trumpetService.keyPress(event);
  }

}

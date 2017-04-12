import { TestBed, inject } from '@angular/core/testing';

import { TrumpetService } from './trumpet.service';

describe('TrumpetService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrumpetService]
    });
  });

  it('should ...', inject([TrumpetService], (service: TrumpetService) => {
    expect(service).toBeTruthy();
  }));
});

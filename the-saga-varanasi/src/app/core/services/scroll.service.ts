import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ScrollService {
  private _activeSection$ = new BehaviorSubject<string>('hero');
  activeSection$ = this._activeSection$.asObservable();

  setActive(sectionId: string) {
    this._activeSection$.next(sectionId);
  }
}

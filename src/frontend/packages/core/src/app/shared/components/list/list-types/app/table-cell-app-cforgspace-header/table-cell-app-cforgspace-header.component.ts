import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../../packages/store/src/lib/app-state';
import { TableCellAppCfOrgSpaceBase } from '../TableCellAppCfOrgSpaceBase';

@Component({
  selector: 'app-table-cell-app-cforgspace-header',
  templateUrl: './table-cell-app-cforgspace-header.component.html',
  styleUrls: ['./table-cell-app-cforgspace-header.component.scss'],
})
export class TableCellAppCfOrgSpaceHeaderComponent extends TableCellAppCfOrgSpaceBase {

  constructor(store: Store<AppState>) {
    super(store);
  }

}

import { Component, OnInit } from '@angular/core';
import { MatRadioChange } from '@angular/material';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of } from 'rxjs';

import {
  StackedInputActionConfig,
} from '../../../../../../../core/src/shared/components/stacked-input-actions/stacked-input-action/stacked-input-action.component';
import {
  StackedInputActionsState,
  StackedInputActionsUpdate,
} from '../../../../../../../core/src/shared/components/stacked-input-actions/stacked-input-actions.component';
import { StepOnNextFunction } from '../../../../../../../core/src/shared/components/stepper/step/step.component';
import { UsersRolesSetIsRemove, UsersRolesSetUsers } from '../../../../../actions/users-roles.actions';
import { CFAppState } from '../../../../../cf-app-state';
import { CfUser } from '../../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';

export class ManageUsersSetUsernamesHelper {
  static createGuid(username: string, cfGuid: string, orgGuid: string): string {
    return `${username}/${cfGuid}/${orgGuid}`;
  }

  static usernameFromGuid(guid: string): string {
    const endOfUsername = guid.lastIndexOf('/', guid.lastIndexOf('/') - 1);
    return guid.substring(0, endOfUsername);
  }
}

@Component({
  selector: 'app-manage-users-set-usernames',
  templateUrl: './manage-users-set-usernames.component.html',
  styleUrls: ['./manage-users-set-usernames.component.scss']
})
export class ManageUsersSetUsernamesComponent implements OnInit {

  public stepValid = new BehaviorSubject<boolean>(false);
  public valid$: Observable<boolean> = this.stepValid.asObservable();
  private usernames: StackedInputActionsUpdate;
  public origin: string;

  public stackedActionConfig: StackedInputActionConfig = {
    isEmailInput: false,
    text: {
      placeholder: 'Username',
      requiredError: 'Username is required',
      uniqueError: 'Username is not unique'
    }
  };

  public stateIn = new BehaviorSubject<StackedInputActionsState[]>([]);

  constructor(
    private store: Store<CFAppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) { }

  ngOnInit() {
    // When we add username validation the processing state should be used to show validation progress and result
    const processingState: StackedInputActionsState[] = [];
    // Object.keys(this.users.values).forEach(key => {
    //   processingState.push({
    //     key,
    //     result: StackedInputActionResult.PROCESSING,
    //   });
    // });
    this.stateIn.next(processingState);
  }

  stateOut(usernames: StackedInputActionsUpdate) {
    this.usernames = usernames;
    this.stepValid.next(usernames.valid);
  }

  setIsRemove(event: MatRadioChange) {
    this.store.dispatch(new UsersRolesSetIsRemove(!event.value));
  }

  onNext: StepOnNextFunction = () => {
    const users: CfUser[] = Object.values(this.usernames.values).map(username => {
      return {
        username,
        guid: ManageUsersSetUsernamesHelper.createGuid(username, this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid)
      } as CfUser;
    });
    this.store.dispatch(new UsersRolesSetUsers(this.activeRouteCfOrgSpace.cfGuid, users, this.origin));
    return of({
      success: true
    });
  }
}

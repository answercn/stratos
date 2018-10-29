import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription, combineLatest } from 'rxjs';
import { filter, switchMap, tap, map } from 'rxjs/operators';

import { IService } from '../../../../core/cf-api-svc.types';
import { ServicesWallService } from '../../../../features/services/services/services-wall.service';
import { SetCreateServiceInstanceServiceGuid } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../../packages/store/src/lib/app-state';
import {
  selectCreateServiceInstanceCfGuid,
  selectCreateServiceInstanceSpaceGuid,
} from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { CsiGuidsService } from '../csi-guids.service';
import { entityFactory, serviceSchemaKey } from '../../../../store/helpers/entity-factory';

@Component({
  selector: 'app-select-service',
  templateUrl: './select-service.component.html',
  styleUrls: ['./select-service.component.scss'],
  providers: [
    ServicesWallService
  ]
})
export class SelectServiceComponent implements OnDestroy, AfterContentInit {
  cfGuid: string;
  serviceSubscription: Subscription;
  services$: Observable<APIResource<IService>[]>;
  stepperForm: FormGroup;
  validate: BehaviorSubject<boolean> = new BehaviorSubject(false);
  isFetching$: Observable<boolean>;
  selectedService$: Observable<APIResource<IService>>;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private csiGuidService: CsiGuidsService,
    private servicesWallService: ServicesWallService
  ) {
    this.stepperForm = new FormGroup({
      service: new FormControl('', [<any>Validators.required]),
    });
    const cfSpaceGuid$ =
      combineLatest(
        this.store.select(selectCreateServiceInstanceCfGuid),
        this.store.select(selectCreateServiceInstanceSpaceGuid)
      ).pipe(
        filter(([p, q]) => !!p && !!q)
      );
    const schema = entityFactory(serviceSchemaKey);
    this.isFetching$ = cfSpaceGuid$.pipe(
      switchMap(([cfGuid, spaceGuid]) => {
        const paginationKey = this.servicesWallService.getSpaceServicePagKey(cfGuid, spaceGuid);
        const paginationMonitor = this.paginationMonitorFactory.create(paginationKey, schema);
        return paginationMonitor.fetchingCurrentPage$;
      }),
      tap(fetching => {
        fetching ? this.stepperForm.disable() : this.stepperForm.enable();
      })
    );
    this.services$ = cfSpaceGuid$.pipe(
      tap(([cfGuid]) => this.cfGuid = cfGuid),
      switchMap(([cfGuid, spaceGuid]) => this.servicesWallService.getServicesInSpace(cfGuid, spaceGuid)),
      filter(p => !!p),
      map(services => services.sort((a, b) => a.entity.label.localeCompare(b.entity.label))),
      tap(services => {
        if (services.length === 1) {
          const guid = services[0].metadata.guid;
          this.stepperForm.controls.service.setValue(guid);
        }
      })
    );

    this.selectedService$ = combineLatest(this.services$, this.stepperForm.controls.service.statusChanges).pipe(
      map(([services, change]) => services.filter(a => a.entity.guid === this.stepperForm.controls.service.value)[0]),
      filter(p => !!p)
    );
  }

  onNext = (): Observable<StepOnNextResult> => {
    const serviceGuid = this.stepperForm.controls.service.value;
    this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceGuid));
    this.csiGuidService.serviceGuid = serviceGuid;
    this.csiGuidService.cfGuid = this.cfGuid;
    return observableOf({ success: true });
  }

  ngAfterContentInit() {
    this.serviceSubscription = this.stepperForm.controls.service.statusChanges.pipe(
      map(() => this.validate.next(this.stepperForm.controls.service.valid))
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.serviceSubscription.unsubscribe();
  }
}

import { LightningElement, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { createRecord, updateRecord, deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getALLtask from '@salesforce/apex/TaskClass.getAllTask';

import TASK_OBJECT from '@salesforce/schema/Task__c';
import ID_FIELD from '@salesforce/schema/Task__c.Id';
import TASK_Name from '@salesforce/schema/Task__c.Name';
import PRIORIY_FIELD from '@salesforce/schema/Task__c.priorities__c';
import STATUS_FIELD from '@salesforce/schema/Task__c.Status__c';

export default class TaskComponent extends LightningElement {
    task;
    taskdata;
    taskname;
    priority;
    status;
    PpickListvalues;
    SpickListvalues;
    error;
    wiredActivities;
    isModalOpen = false;
    resupdate;
    resdelete;
    rescomplete;
    taskdataCom;

    @wire(getObjectInfo, { objectApiName: TASK_OBJECT })
    objectInfo;

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: PRIORIY_FIELD })
    PriorityPicklistValues({ data, error }) {
        if (data) {
            this.PpickListvalues = data.values;
            this.error = undefined;
        }
        if (error) {
            this.error = error;
            this.PpickListvalues = undefined;
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: STATUS_FIELD })
    StatusPicklistValues({ data, error }) {
        if (data) {
            this.SpickListvalues = data.values;
            this.error = undefined;
        }
        if (error) {
            this.error = error;
            this.SpickListvalues = undefined;
        }
    }

    @wire(getALLtask)
    wiredTasks(value) {
        this.wiredActivities = value;
        const { data, error } = value;
        if (data) {
            this.taskdata = data;
            this.taskdata = this.taskdata.filter(function(value) {
                if (value.Status__c == 'incomplete') {
                    return value;
                }
            });
            this.taskdataCom = data.filter(function(value) {
                if (value.Status__c == 'Complete') {
                    return value;
                }
            });
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.taskdata = undefined;
        }
    }
    handleOnchange(event) {
        this.taskname = event.detail.value;
    }
    handelPriority(event) {
        this.priority = event.detail.value;
    }
    handleStatus(event) {
        this.status = event.detail.value;;
    }
    saveRecord() {
        const fields = {};
        fields[TASK_Name.fieldApiName] = this.taskname;
        fields[PRIORIY_FIELD.fieldApiName] = this.priority;
        fields[STATUS_FIELD.fieldApiName] = this.status;
        const recordInput = { apiName: TASK_OBJECT.objectApiName, fields };
        createRecord(recordInput).then(task => {
            this.task = task.id;
            refreshApex(this.wiredActivities);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Task created',
                    variant: 'success',
                }),
            );
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating Task',
                    message: error.body.message,
                    variant: 'error',
                }),
            );
        });
    }
    updateRecord(event) {
        let updateId = event.target.id;
        this.resupdate = updateId.split("-");
        this.isModalOpen = true;
    }
    closeModal() {
        this.isModalOpen = false;
    }
    deleteRecord(event) {
        let deleteId = event.target.id;
        this.resdelete = deleteId.split("-");
        deleteRecord(this.resdelete[0]).then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Task deleted',
                    variant: 'success'
                })
            );
            return refreshApex(this.wiredActivities);
        })
    }
    taskcompleted(event) {
        let completeId = event.target.id;
        this.rescomplete = completeId.split("-");
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.rescomplete[0];
        fields[STATUS_FIELD.fieldApiName] = 'Complete';
        const recordInput = { fields };
        updateRecord(recordInput).then(() => {
            return refreshApex(this.wiredActivities);
        });
    }
    submitDetails() {
        this.isModalOpen = false;
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.resupdate[0];
        fields[TASK_Name.fieldApiName] = this.taskname;
        fields[PRIORIY_FIELD.fieldApiName] = this.priority;
        fields[STATUS_FIELD.fieldApiName] = this.status;
        const recordInput = { fields };
        updateRecord(recordInput).then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Task updated',
                    variant: 'success'
                })
            );
            return refreshApex(this.wiredActivities);
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating Task',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }
}
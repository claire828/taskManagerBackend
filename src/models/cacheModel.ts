import TaskConfig from "../configs/TaskConfig";
import TedisInst from "../instances/tedisInst";
import '../extensions/numberExtension';
import '../extensions/arrayExtension';
import '../extensions/stringExtension';
import TaskModel from "./taskModel";

export default class CacheModel{

    private static readonly ExpiredSec = (4).exHoursInSec();

    public static async getTasks(account:string):Promise<TaskConfig.Task[]>{
        const strTasks = await this.getTask(account);
        if(strTasks) return strTasks.exToObj() as TaskConfig.Task[];
        return null;
    }

     // 儲存整筆Task的快取
    public static SaveTasksToCache(account:string, allTasks:TaskConfig.Task[] ){
        TedisInst.get().setex(account,this.ExpiredSec , JSON.stringify(allTasks));
    }

    // add task (draf)
    public static async addTask(account:string, draf:TaskConfig.Draf, tId:string){
        const cacheList = await this.getTaskList(account)
        if(cacheList){
            cacheList.push({
                title:draf.title,
                content:draf.content,
                tId,
                status:TaskConfig.Status.Draf,
            });
            this.SaveTasksToCache(account,cacheList);
        }
    }

    // conform DrafToTask
    public static async conformDrafToTask( account:string, tId:string, task:TaskConfig.Task ){
        const cacheList = await this.getTaskList(account)
        if(cacheList){
            const inx = cacheList.findIndex( x=> x.tId === tId);
            if(inx === -1) return;
            cacheList[inx] = task;
            this.SaveTasksToCache(account,cacheList);
        }
    }

    //TODO 這邊可以用<T>來做
    public static async getTaskList(account:string):Promise<TaskConfig.Task[]>{
        const oldCache = await this.getTask(account);
        return oldCache ? (oldCache.exToObj() as TaskConfig.Task[]) : null;
    }


    private static async getTask(key:string):Promise<string>{
        const oldCache = await TedisInst.get().get(key);
        return oldCache?.toString() || null;
    }

}

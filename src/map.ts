import { QuadTreeSet, Shape } from "fast-quadtree-ts";
import BoundedBox from "./map_elements/bounded_box";
import Platform from "./map_elements/platform";
import SoundSource from "./map_elements/sound_source";
import Zone from "./map_elements/zone";
import Gameplay from "./states/gameplay";
import Entity from "./entities/entity";

export default class Map extends BoundedBox {
    private platforms: Platform[] = [];
    private zones: Zone[] = [];
    private soundSources: SoundSource[] = [];
    entities: QuadTreeSet<Entity>;
    private gameplay: Gameplay;
    protected get allElements(): BoundedBox[] {
        return [...this.platforms, ...this.zones, ...this.soundSources];
    }
    constructor(
        gameplay: Gameplay,
        minx: number,
        maxx: number,
        miny: number,
        maxy: number,
        minz: number,
        maxz: number
    ) {
        super(minx, maxx, miny, maxy, minz, maxz);
        this.gameplay = gameplay;
        this.entities = new QuadTreeSet<Entity>(
            { center: this.center, size: this.size },
            {
                unitKeyGetter: (vec, entity) => (entity ? entity.id : 0),
                unitPositionGetter: (entity) => entity,
            }
        );
    }
    *getEntitiesIn(between: BoundedBox): Generator<Entity> {
        for (let { vec, unit } of this.entities.queryIteratable({
            center: between.center,
            size: between.size,
            type: "rectangle",
        })) {
            if (unit.z >= between.minz && unit.z <= between.maxz) {
                yield unit;
            }
        }
    }
    addEntity(entity: Entity): Entity {
        this.entities.add(entity);
        return entity;
    }
    removeEntity(entity: Entity): boolean {
        return this.entities.delete(entity);
    }
    spawnPlatform(
        minx: number,
        maxx: number,
        miny: number,
        maxy: number,
        minz: number,
        maxz: number,
        type: string = "air"
    ): Platform {
        const platform = new Platform(minx, maxx, miny, maxy, minz, maxz, type);
        this.platforms.push(platform);
        return platform;
    }

    spawnZone(
        minx: number,
        maxx: number,
        miny: number,
        maxy: number,
        minz: number,
        maxz: number,
        text: string = "nowhere"
    ): Zone {
        const zone = new Zone(minx, maxx, miny, maxy, minz, maxz, text);
        this.zones.push(zone);
        return zone;
    }

    spawnSoundSource(
        minx: number,
        maxx: number,
        miny: number,
        maxy: number,
        minz: number,
        maxz: number,
        path: string,
        volume: number = 0.9
    ): SoundSource {
        const soundSource = new SoundSource(
            this.gameplay.game,
            minx,
            maxx,
            miny,
            maxy,
            minz,
            maxz,
            path,
            this.gameplay.player,
            volume
        );
        this.soundSources.push(soundSource);
        return soundSource;
    }

    private getElementAt<T extends BoundedBox>(
        x: number,
        y: number,
        z: number,
        elements: T[]
    ): T | null {
        for (let element of elements.slice().reverse()) {
            if (element.inBound(x, y, z)) {
                return element;
            }
        }
        return null;
    }

    getPlatformAt(x: number, y: number, z: number): Platform | null {
        return this.getElementAt(x, y, z, this.platforms);
    }

    getZoneAt(x: number, y: number, z: number): Zone | null {
        return this.getElementAt(x, y, z, this.zones);
    }
    getSoundSourceAt(x: number, y: number, z: number): SoundSource | null {
        return this.getElementAt(x, y, z, this.soundSources);
    }
    update(delta: number): void {
        this.allElements.forEach((element) => element.update(delta));
    }
    destroy(): void {
        this.allElements.forEach((element) => element.destroy());
        this.destroyAllEntities();
    }
    destroyAllEntities() {
        const entitiesToDestroy: Entity[] = [];
        this.entities.forEach((entity) => entitiesToDestroy.push(entity));
        entitiesToDestroy.forEach((entity) => entity.destroy());
    }
}

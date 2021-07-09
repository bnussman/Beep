import { Type } from "@mikro-orm/core";
import { Point } from '../location/resolver';
import wkx from 'wkx';
import { Buffer } from 'buffer';

export class PointType extends Type<Point | undefined, string | undefined> {

  convertToDatabaseValue(value: Point | undefined): string | undefined {
    if (!value) {
      return value;
    }

    return `point(${value.latitude} ${value.longitude})`;
  }

  convertToJSValue(value: string | undefined): Point | undefined {
      if (!value) {
          return undefined;
      }

      // @ts-expect-error YOUR TYPES ARE SO BAD WHAT ARE YOU DOING??
      const { coordinates } = value.charAt(0) == 'P' ?
          wkx.Geometry.parse(value).toGeoJSON() : 
          wkx.Geometry.parse(Buffer.from(value, 'hex')).toGeoJSON();

      return new Point(coordinates[0], coordinates[1]);
  }

  convertToJSValueSQL(key: string): string {
      return `ST_AsText(${key})`;
  }

  convertToDatabaseValueSQL(key: string): string {
      return `ST_PointFromText(${key})`;
  }

  getColumnType(): string {
      return 'geometry';
  }
}

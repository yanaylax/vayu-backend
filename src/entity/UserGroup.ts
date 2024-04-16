import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class UserGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  status: string;
}

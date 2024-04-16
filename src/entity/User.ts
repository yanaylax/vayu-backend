import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserGroup } from "./UserGroup";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  status: string;

  @ManyToOne(() => UserGroup)
  @JoinColumn({ name: "groupId" })
  group: UserGroup | null;
}
